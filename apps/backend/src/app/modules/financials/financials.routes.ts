import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { prismaAdmin } from '../../../prisma/client'
import { FinancialsController } from './financials.controller'
import { FinancialValidation } from './financials.validation'

const seller = Router()

seller.get('/dashboard', requireSeller, FinancialsController.getDashboard)
seller.get(
  '/analytics/profit-loss',
  requireSeller,
  validateRequest(FinancialValidation.getProfitLoss),
  FinancialsController.getProfitLoss,
)

// TRANSITIONAL: /couriers list is relocated to the `couriers` module in Phase 11.
// Kept inline here, behavior-identical, so the picker endpoint keeps working.
seller.get('/couriers', requireSeller, async (_req, res, next) => {
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

// Admin financials surface (all-business reporting) is added in the admin refactor.
const admin = Router()

export const financialsRoutes = { seller, admin }
