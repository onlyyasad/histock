import { Router } from 'express'
import { z } from 'zod'
import { requireSeller } from '../../middlewares/auth'
import { prismaAdmin, prismaWithScope } from '../../../prisma/client'
import { DashboardService } from './financials.dashboard.service'
import { AnalyticsService } from './financials.analytics.service'
import { RemittanceService, CreateRemittanceSchema } from './financials.remittance.service'

const router = Router()

function getBusinessId(req: Express.Request & { user?: unknown }) {
  return (req.user as { businessId: string }).businessId
}

// GET /api/v1/dashboard
router.get('/dashboard', requireSeller, async (req, res, next) => {
  try {
    const snapshot = await new DashboardService().getTodaySnapshot(getBusinessId(req))
    res.json(snapshot)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/analytics/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/analytics/profit-loss', requireSeller, async (req, res, next) => {
  try {
    const { from, to } = req.query
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query params required (YYYY-MM-DD)' })
    }
    const data = await new AnalyticsService().getProfitLoss(
      getBusinessId(req),
      new Date(from as string),
      new Date(to as string),
    )
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/remittances
router.get('/remittances', requireSeller, async (req, res, next) => {
  try {
    const businessId = getBusinessId(req)
    const remittances = await new RemittanceService(prismaWithScope(businessId)).list()
    res.json(remittances)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/remittances/:id
router.get('/remittances/:id', requireSeller, async (req, res, next) => {
  try {
    const businessId = getBusinessId(req)
    const remittance = await new RemittanceService(prismaWithScope(businessId)).getById(
      req.params.id as string,
    )
    if (!remittance) return res.status(404).json({ error: 'Not found' })
    res.json(remittance)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/remittances
router.post('/remittances', requireSeller, async (req, res, next) => {
  try {
    const parsed = CreateRemittanceSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const businessId = getBusinessId(req)
    const remittance = await new RemittanceService(prismaWithScope(businessId)).create(
      businessId,
      parsed.data,
    )
    res.status(201).json(remittance)
  } catch (err: unknown) {
    if (err instanceof Error && 'status' in err) {
      return res.status(err.status as number).json({ error: err.message })
    }
    next(err)
  }
})

// GET /api/v1/couriers — list all active couriers (used in remittance import picker)
router.get('/couriers', requireSeller, async (_req, res, next) => {
  try {
    const couriers = await prismaAdmin.courier.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    res.json(couriers)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/remittances/import — create batch from CSV-matched orders with per-order amounts
router.post('/remittances/import', requireSeller, async (req, res, next) => {
  try {
    const businessId = getBusinessId(req)

    const parsed = z
      .object({
        courierId: z.string().uuid(),
        batchName: z.string().min(1).max(200),
        fileName: z.string().min(1),
        orders: z
          .array(z.object({ orderId: z.string().uuid(), codAmount: z.number().positive() }))
          .min(1),
        unmatchedCount: z.number().int().min(0).default(0),
      })
      .safeParse(req.body)

    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const { courierId, batchName, fileName, orders, unmatchedCount } = parsed.data
    const totalCodAmount = orders.reduce((sum, o) => sum + o.codAmount, 0)

    const remittance = await prismaAdmin.$transaction(async (tx) => {
      const batch = await tx.remittance.create({
        data: {
          businessId,
          courierId,
          batchName,
          totalCodAmount,
          totalOrders: orders.length,
          orders: {
            create: orders.map((o) => ({ orderId: o.orderId, codAmount: o.codAmount })),
          },
        },
        include: { courier: { select: { id: true, name: true } } },
      })

      await tx.remittanceImport.create({
        data: {
          businessId,
          fileName,
          matchedCount: orders.length,
          unmatchedCount,
        },
      })

      return batch
    })

    res.status(201).json(remittance)
  } catch (err) {
    next(err)
  }
})

export { router as financialsRoutes }
