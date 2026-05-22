import { Router } from 'express'
import { requireSeller, requireRole } from '../../middlewares/auth'
import { prismaAdmin, prismaWithScope } from '../../../prisma/client'
import { OrdersService } from './orders.service'
import { OrderStateService } from './orders.state.service'
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  UpdateOrderMetadataSchema,
} from './orders.validation'

const router = Router()

function getService(req: Express.Request & { user?: unknown }) {
  const user = req.user as { businessId: string }
  return new OrdersService(prismaWithScope(user.businessId))
}

// GET /api/v1/orders
router.get('/', requireSeller, async (req, res, next) => {
  try {
    const { status, courierId, paymentMethod, from, to, page, limit } = req.query
    const orders = await getService(req).list({
      status: status as never,
      courierId: courierId as string,
      paymentMethod: paymentMethod as string,
      from: from as string,
      to: to as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 30,
    })
    res.json(orders)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/orders/:id
router.get('/:id', requireSeller, async (req, res, next) => {
  try {
    const order = await getService(req).getById(req.params.id as string)
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(order)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/orders
router.post('/', requireSeller, async (req, res, next) => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const user = req.user as { businessId: string; id: string }
    const order = await getService(req).create(user.businessId, user.id, parsed.data as never)
    res.status(201).json(order)
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ORDER_CAP_REACHED') {
      return res.status(402).json({ error: err.message, code: 'ORDER_CAP_REACHED' })
    }
    next(err)
  }
})

// PATCH /api/v1/orders/:id/status — ALL status changes go through OrderStateService
router.patch('/:id/status', requireSeller, async (req, res, next) => {
  try {
    const parsed = UpdateOrderStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const user = req.user as { businessId: string; id: string }
    const stateService = new OrderStateService(prismaAdmin)
    await stateService.transition({
      orderId: req.params.id as string,
      businessId: user.businessId,
      toStatus: parsed.data.status as never,
      reason: parsed.data.reason,
      userId: user.id,
    })
    res.json({ ok: true })
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      return res.status(err.status as number).json({ error: err.message })
    }
    next(err)
  }
})

// PATCH /api/v1/orders/:id — metadata only (courier, notes, tags) — NOT status
router.patch('/:id', requireSeller, async (req, res, next) => {
  try {
    const parsed = UpdateOrderMetadataSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const order = await getService(req).updateMetadata(req.params.id as string, parsed.data)
    res.json(order)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/orders/:id
router.delete('/:id', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    await getService(req).softDelete(req.params.id as string)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/orders/:id/payment — COD payment confirmation (delivered only)
router.patch('/:id/payment', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }
    const order = await getService(req).confirmCodPayment(
      user.businessId,
      req.params.id as string,
    )
    res.json(order)
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      return res.status(err.status as number).json({ error: err.message })
    }
    next(err)
  }
})

export { router as ordersRoutes }
