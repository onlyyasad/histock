import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import { prismaWithScope } from '../../../prisma/client'
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

export { router as financialsRoutes }
