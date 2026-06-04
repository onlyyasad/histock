import { Router } from 'express'
import { requireSeller, requireRole } from '../../middlewares/auth'
import { prismaAdmin, prismaWithScope } from '../../../prisma/client'
import { ProductsService } from './products.service'
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
  CreateCostEntrySchema,
} from './products.validation'

const router = Router()

function getService(req: Express.Request & { user?: unknown }) {
  const user = req.user as { businessId: string }
  return new ProductsService(prismaWithScope(user.businessId))
}

// GET /api/v1/products/:id
router.get('/:id', requireSeller, async (req, res, next) => {
  try {
    const product = await getService(req).getById(req.params.id as string)
    if (!product) return res.status(404).json({ error: 'Not found' })
    res.json(product)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/products
// Returns products with avg margin % derived from delivered order allocations.
// Two queries: one ORM list + one SQL aggregate — merged in memory.
router.get('/', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }
    const businessId = user.businessId

    const [products, margins] = await Promise.all([
      getService(req).listProducts(),
      // Single aggregate: revenue and COGS per product across all delivered orders
      prismaAdmin.$queryRaw<
        Array<{ product_id: string; revenue: string; cogs: string }>
      >`
        SELECT
          oi.product_id,
          SUM(oi.total_price)::text                    AS revenue,
          COALESCE(SUM(oca.total_cost), 0)::text       AS cogs
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN order_cost_allocations oca ON oca.order_item_id = oi.id
        WHERE o.business_id = ${businessId}::uuid
          AND o.status = 'delivered'
          AND o.deleted_at IS NULL
        GROUP BY oi.product_id
      `,
    ])

    const marginMap = new Map(
      margins.map((m) => {
        const revenue = Number(m.revenue)
        const cogs = Number(m.cogs)
        const margin = revenue > 0 ? Math.round(((revenue - cogs) / revenue) * 10000) / 100 : null
        return [m.product_id, margin]
      }),
    )

    const result = products.map((p) => ({
      ...p,
      avgMarginPct: marginMap.get(p.id) ?? null,
    }))

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/products
router.post('/', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const parsed = CreateProductSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const user = req.user as { businessId: string }
    const { product, warning } = await getService(req).createProduct(user.businessId, parsed.data)
    res.status(201).json({ ...product, warning: warning ?? null })
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'PRODUCT_CAP_REACHED') {
      return res.status(402).json({ error: err.message, code: 'PRODUCT_CAP_REACHED' })
    }
    next(err)
  }
})

// PATCH /api/v1/products/:id
router.patch('/:id', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const parsed = UpdateProductSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const product = await getService(req).updateProduct(req.params.id as string, parsed.data)
    res.json(product)
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err && err.status === 404) {
      return res.status(404).json({ error: 'Product not found' })
    }
    next(err)
  }
})

// DELETE /api/v1/products/:id (soft delete)
router.delete('/:id', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    await getService(req).softDeleteProduct(req.params.id as string)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/products/:id/variants
router.post(
  '/:id/variants',
  requireSeller,
  requireRole('owner', 'manager'),
  async (req, res, next) => {
    try {
      const parsed = CreateVariantSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

      const user = req.user as { businessId: string }
      const variant = await getService(req).createVariant(user.businessId, req.params.id as string, parsed.data)
      res.status(201).json(variant)
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err && err.status === 404) {
        return res.status(404).json({ error: 'Product not found' })
      }
      next(err)
    }
  },
)

// POST /api/v1/products/:id/cost-entries
router.post(
  '/:id/cost-entries',
  requireSeller,
  requireRole('owner', 'manager'),
  async (req, res, next) => {
    try {
      const idempotencyKey = req.headers['x-idempotency-key'] as string
      if (!idempotencyKey) {
        return res.status(400).json({ error: 'X-Idempotency-Key header required' })
      }

      const parsed = CreateCostEntrySchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

      const user = req.user as { businessId: string }
      const { entry, created } = await getService(req).createCostEntry(
        user.businessId,
        req.params.id as string,
        { ...parsed.data, idempotencyKey },
      )
      res.status(created ? 201 : 200).json(entry)
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err && err.status === 422) {
        return res.status(422).json({ error: 'Idempotency key conflict: same key, different body' })
      }
      next(err)
    }
  },
)

export { router as productsRoutes }
