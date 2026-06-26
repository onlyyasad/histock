import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
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

// Admin financials surface (all-business reporting) is added in the admin refactor.
const admin = Router()

export const financialsRoutes = { seller, admin }
