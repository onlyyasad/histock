import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import type { ScopedPrisma, AdminPrisma } from '../../../prisma/types'
import ApiError from '../../../errors/ApiError'
import {
  productVariantSelect,
  productCostEntrySelect,
  CAP_WARNING_THRESHOLD,
} from './products.constants'
import type {
  ICreateProductInput,
  IUpdateProductInput,
  ICreateVariantInput,
  IProductCapWarning,
  ISkuCapWarning,
} from './products.interface'

// create/update/updateMany are not intercepted by the scoped client — reach them
// through the writable (admin-typed) view. Preserves existing behavior exactly.
const writable = (db: ScopedPrisma) => db as unknown as AdminPrisma

const getById = (db: ScopedPrisma, productId: string) =>
  db.product.findFirst({
    where: { id: productId },
    include: {
      variants: { where: { deletedAt: null }, select: productVariantSelect },
      costEntries: { orderBy: { entryDate: 'desc' }, select: productCostEntrySelect },
    },
  })

const listProducts = (db: ScopedPrisma) =>
  db.product.findMany({
    include: { variants: { where: { deletedAt: null }, select: productVariantSelect } },
    orderBy: { createdAt: 'desc' },
  })

// Revenue + COGS per product across delivered orders (raw aggregate). Cross-tenant
// safe via the explicit business_id filter — uses prismaAdmin like the original.
const listProductMargins = (businessId: string) =>
  prismaAdmin.$queryRaw<Array<{ product_id: string; revenue: string; cogs: string }>>`
    SELECT
      oi.product_id,
      SUM(oi.total_price)::text                    AS revenue,
      COALESCE(SUM(oca.total_cost), 0)::text       AS cogs
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN order_cost_allocations oca ON oca.order_item_id = oi.id
    WHERE o.business_id = ${businessId}
      AND o.status = 'delivered'
      AND o.deleted_at IS NULL
    GROUP BY oi.product_id
  `

// --- caps (module-private; need cross-tenant counts via prismaAdmin) ---

const checkProductCap = async (businessId: string): Promise<IProductCapWarning | null> => {
  const sub = await prismaAdmin.subscription.findUnique({
    where: { businessId },
    include: { plan: { select: { maxProducts: true } } },
  })
  const cap = sub?.plan.maxProducts ?? null
  if (cap === null) return null

  const used = await prismaAdmin.product.count({
    where: { businessId, deletedAt: null, isArchived: false },
  })

  if (used >= cap) {
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      `Product limit reached (${cap}). Upgrade your plan to add more products.`,
      { code: 'PRODUCT_CAP_REACHED' },
    )
  }
  if (used >= Math.floor(cap * CAP_WARNING_THRESHOLD)) {
    return { type: 'PRODUCT_CAP_NEAR', used, cap }
  }
  return null
}

const checkSkuCap = async (businessId: string): Promise<ISkuCapWarning | null> => {
  const sub = await prismaAdmin.subscription.findUnique({
    where: { businessId },
    include: { plan: { select: { maxSkus: true } } },
  })
  const cap = sub?.plan.maxSkus ?? null
  if (cap === null) return null

  const [variantCount, noVariantProductCount] = await Promise.all([
    prismaAdmin.productVariant.count({ where: { businessId, deletedAt: null } }),
    prismaAdmin.product.count({
      where: {
        businessId,
        deletedAt: null,
        isArchived: false,
        variants: { none: { deletedAt: null } },
      },
    }),
  ])
  const used = variantCount + noVariantProductCount

  if (used >= cap) {
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      `SKU limit reached (${cap}). Upgrade your plan to add more variants.`,
      { code: 'SKU_CAP_REACHED' },
    )
  }
  if (used >= Math.floor(cap * CAP_WARNING_THRESHOLD)) {
    return { type: 'SKU_CAP_NEAR', used, cap }
  }
  return null
}

// --- writes ---

const createProduct = async (db: ScopedPrisma, businessId: string, data: ICreateProductInput) => {
  const warning = await checkProductCap(businessId)
  const product = await db.product.create({ data: { ...data, businessId } })
  return { product, warning }
}

const updateProduct = async (db: ScopedPrisma, productId: string, data: IUpdateProductInput) => {
  const existing = await db.product.findFirst({ where: { id: productId } })
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found')
  }
  return writable(db).product.update({ where: { id: productId }, data })
}

const softDeleteProduct = (db: ScopedPrisma, productId: string) =>
  writable(db).product.update({
    where: { id: productId },
    data: { deletedAt: new Date(), isActive: false },
  })

const createVariant = async (
  db: ScopedPrisma,
  businessId: string,
  productId: string,
  data: ICreateVariantInput,
) => {
  const warning = await checkSkuCap(businessId)
  const product = await db.product.findFirst({ where: { id: productId } })
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found')
  }
  const variant = await writable(db).productVariant.create({
    data: { ...data, businessId, productId },
  })
  return { variant, warning }
}

export const ProductsService = {
  getById,
  listProducts,
  listProductMargins,
  createProduct,
  updateProduct,
  softDeleteProduct,
  createVariant,
}
