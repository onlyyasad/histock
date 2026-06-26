import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import { prismaAdmin } from '../../../prisma/client'
import { DashboardService } from './financials.dashboard.service'
import { AnalyticsService } from './financials.analytics.service'

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

export { router as financialsRoutes }
