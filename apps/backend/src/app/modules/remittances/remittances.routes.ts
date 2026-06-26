import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { RemittancesController } from './remittances.controller'
import { RemittanceValidation } from './remittances.validation'

const seller = Router()

seller.get('/', requireSeller, RemittancesController.list)
seller.post(
  '/import',
  requireSeller,
  validateRequest(RemittanceValidation.importRemittance),
  RemittancesController.importBatch,
)
seller.get('/:id', requireSeller, RemittancesController.getById)
seller.post(
  '/',
  requireSeller,
  validateRequest(RemittanceValidation.createRemittance),
  RemittancesController.create,
)

// Admin remittance surface (all-business) is added in the admin refactor.
const admin = Router()

export const remittancesRoutes = { seller, admin }
