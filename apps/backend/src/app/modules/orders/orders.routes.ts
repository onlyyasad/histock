import { Router } from 'express'
import { requireSeller, requireRole } from '../../middlewares/auth'
import { prismaAdmin, prismaWithScope } from '../../../prisma/client'
import { OrdersService } from './orders.service'
import { OrderStateService } from './orders.state.service'
import type {
  IOrderFilters,
  ICreateOrderInput,
  IUpdateOrderMetadataInput,
} from './orders.interface'
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  UpdateOrderMetadataSchema,
  AddOrderNoteSchema,
} from './orders.validation'

const router = Router()

// Transitional binding shim — keeps the existing handlers below unchanged while the
// service is now an object literal. Removed when routes are rewritten (Task 6).
function getService(req: Express.Request & { user?: unknown }) {
  const user = req.user as { businessId: string; id: string }
  const db = prismaWithScope(user.businessId)
  return {
    list: (filters: IOrderFilters) => OrdersService.list(db, filters),
    getById: (id: string) => OrdersService.getById(db, id),
    create: (_businessId: string, _userId: string, data: ICreateOrderInput) =>
      OrdersService.create(user.businessId, data),
    updateMetadata: (id: string, data: IUpdateOrderMetadataInput) =>
      OrdersService.updateMetadata(db, id, data),
    softDelete: (id: string) => OrdersService.softDelete(db, id),
    confirmCodPayment: (_businessId: string, id: string) => OrdersService.confirmCodPayment(db, id),
  }
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
    const { order, warning } = await getService(req).create(user.businessId, user.id, parsed.data as never)
    res.status(201).json({ ...order, warning: warning ?? null })
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'ORDER_CAP_REACHED') {
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

// GET /api/v1/orders/:id/cost-breakdown — per-order COGS and margin
router.get('/:id/cost-breakdown', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }
    const businessId = user.businessId
    const orderId = req.params.id as string

    const order = await prismaWithScope(businessId).order.findFirst({
      where: { id: orderId },
      select: { total: true, deliveryFee: true, status: true },
    })
    if (!order) return res.status(404).json({ error: 'Not found' })

    // OrderCostAllocation has no businessId — filter through order relation
    const allocations = await prismaAdmin.orderCostAllocation.findMany({
      where: {
        orderItem: { order: { id: orderId, businessId, deletedAt: null } },
      },
      include: {
        costEntry: { include: { product: { select: { name: true } } } },
        orderItem: { select: { quantity: true } },
      },
    })

    const totalCost = allocations.reduce((sum, a) => sum + Number(a.totalCost), 0)
    const revenue = Number(order.total) - Number(order.deliveryFee)
    const profit = Number((revenue - totalCost).toFixed(2))
    const margin = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0

    res.json({
      totalRevenue: Number(revenue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      profit,
      margin,
      allocations: allocations.map((a) => ({
        productName: a.costEntry.product.name,
        quantity: a.orderItem.quantity,
        costPerUnit: Number(a.costEntry.costPerUnit),
        totalCost: Number(a.totalCost),
      })),
      note:
        allocations.length === 0
          ? order.status === 'delivery_failed'
            ? 'Cost allocation reversed (delivery failed)'
            : 'No cost data — log a purchase for this product to enable COGS tracking'
          : null,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/orders/:id/notes — append-only order note; GET is covered by getById()
router.post('/:id/notes', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string; id: string }
    const businessId = user.businessId
    const orderId = req.params.id as string

    const parsed = AddOrderNoteSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const order = await prismaWithScope(businessId).order.findFirst({
      where: { id: orderId },
      select: { id: true },
    })
    if (!order) return res.status(404).json({ error: 'Not found' })

    const note = await prismaAdmin.orderNote.create({
      data: { orderId, businessId, userId: user.id, content: parsed.data.content },
      include: { user: { select: { id: true, name: true } } },
    })

    res.status(201).json(note)
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
