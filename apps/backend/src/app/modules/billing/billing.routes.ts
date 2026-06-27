import { Router } from 'express'
import validateRequest from '../../middlewares/validateRequest'
import { BillingPlansController } from './billing.plans.controller'
import { BillingValidation } from './billing.validation'

// admin-only module: no seller surface.
const seller = Router()

const admin = Router()
admin.get('/subscription-plans', BillingPlansController.list)
admin.patch(
  '/subscription-plans/:id',
  validateRequest(BillingValidation.updatePlan),
  BillingPlansController.update,
)

export const billingRoutes = { seller, admin }
