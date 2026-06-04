import { prismaAdmin } from '../../../prisma/client'
import type { prismaWithScope } from '../../../prisma/client'

type ScopedPrisma = ReturnType<typeof prismaWithScope>

export class ProductsService {
  constructor(private prisma: ScopedPrisma) {}

  getById(productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId },
      include: {
        variants: {
          where: { deletedAt: null },
          select: { id: true, name: true, price: true, currentStock: true, isActive: true },
        },
        costEntries: {
          orderBy: { entryDate: 'desc' },
          select: {
            id: true,
            entryDate: true,
            lotQuantity: true,
            remainingQty: true,
            totalCost: true,
            costPerUnit: true,
            idempotencyKey: true,
            createdAt: true,
          },
        },
      },
    })
  }

  listProducts() {
    return this.prisma.product.findMany({
      include: {
        variants: {
          where: { deletedAt: null },
          select: { id: true, name: true, price: true, currentStock: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  private async checkProductCap(
    businessId: string,
  ): Promise<{ type: 'PRODUCT_CAP_NEAR'; used: number; cap: number } | null> {
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
      throw Object.assign(
        new Error(`Product limit reached (${cap}). Upgrade your plan to add more products.`),
        { status: 402, code: 'PRODUCT_CAP_REACHED' },
      )
    }

    if (used >= Math.floor(cap * 0.8)) {
      return { type: 'PRODUCT_CAP_NEAR' as const, used, cap }
    }

    return null
  }

  async createProduct(
    businessId: string,
    data: { name: string; sku?: string; description?: string; price: number },
  ) {
    const warning = await this.checkProductCap(businessId)
    const product = await this.prisma.product.create({
      data: { ...data, businessId },
    })
    return { product, warning }
  }

  updateProduct(
    productId: string,
    data: Partial<{
      name: string
      sku: string
      description: string
      price: number
      isActive: boolean
      isArchived: boolean
    }>,
  ) {
    return this.prisma.product.findFirst({
      where: { id: productId },
    }).then((existing) => {
      if (!existing) throw Object.assign(new Error('Product not found'), { status: 404 })
      return (this.prisma as unknown as typeof prismaAdmin).product.update({
        where: { id: productId },
        data,
      })
    })
  }

  softDeleteProduct(productId: string) {
    return (this.prisma as unknown as typeof prismaAdmin).product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), isActive: false },
    })
  }

  private async checkSkuCap(
    businessId: string,
  ): Promise<{ type: 'SKU_CAP_NEAR'; used: number; cap: number } | null> {
    const sub = await prismaAdmin.subscription.findUnique({
      where: { businessId },
      include: { plan: { select: { maxSkus: true } } },
    })
    const cap = sub?.plan.maxSkus ?? null
    if (cap === null) return null

    const [variantCount, noVariantProductCount] = await Promise.all([
      prismaAdmin.productVariant.count({
        where: { businessId, deletedAt: null },
      }),
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
      throw Object.assign(
        new Error(`SKU limit reached (${cap}). Upgrade your plan to add more variants.`),
        { status: 402, code: 'SKU_CAP_REACHED' },
      )
    }

    if (used >= Math.floor(cap * 0.8)) {
      return { type: 'SKU_CAP_NEAR' as const, used, cap }
    }

    return null
  }

  async createVariant(
    businessId: string,
    productId: string,
    data: { name: string; sku?: string; price: number },
  ) {
    const warning = await this.checkSkuCap(businessId)
    const p = await this.prisma.product.findFirst({ where: { id: productId } })
    if (!p) throw Object.assign(new Error('Product not found'), { status: 404 })
    const variant = await (this.prisma as unknown as typeof prismaAdmin).productVariant.create({
      data: { ...data, businessId, productId },
    })
    return { variant, warning }
  }

  async createCostEntry(
    businessId: string,
    productId: string,
    params: {
      variantId?: string
      entryDate: string
      lotQuantity: number
      totalCost: number
      idempotencyKey: string
    },
  ) {
    const { lotQuantity, totalCost, idempotencyKey } = params

    // Idempotency check — use raw client (findUnique disabled on scoped client)
    const existing = await prismaAdmin.productCostEntry.findUnique({
      where: { idempotencyKey },
    })

    if (existing) {
      const sameBody =
        existing.lotQuantity === lotQuantity &&
        Number(existing.totalCost) === totalCost &&
        existing.businessId === businessId

      if (sameBody) return { entry: existing, created: false }
      throw Object.assign(new Error('Idempotency key conflict'), { status: 422 })
    }

    const costPerUnit = Number((totalCost / lotQuantity).toFixed(2))

    const entry = await prismaAdmin.productCostEntry.create({
      data: {
        productId,
        variantId: params.variantId ?? null,
        businessId,
        entryDate: new Date(params.entryDate),
        lotQuantity,
        remainingQty: lotQuantity,
        totalCost,
        costPerUnit,
        idempotencyKey,
      },
    })

    await prismaAdmin.product.update({
      where: { id: productId },
      data: { currentStock: { increment: lotQuantity } },
    })

    return { entry, created: true }
  }
}
