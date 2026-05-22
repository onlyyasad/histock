import { Router } from 'express'
import { requireSeller, requireRole } from '../../middlewares/auth'
import { prismaWithScope } from '../../../prisma/client'
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

// GET /api/v1/products
router.get('/', requireSeller, async (req, res, next) => {
  try {
    const products = await getService(req).listProducts()
    res.json(products)
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
    const product = await getService(req).createProduct(user.businessId, parsed.data)
    res.status(201).json(product)
  } catch (err) {
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
