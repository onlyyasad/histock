import { Router } from 'express'
import validateRequest from '../../middlewares/validateRequest'
import { BusinessesController } from './businesses.controller'
import { BusinessesValidation } from './businesses.validation'
import { BillingPaymentController } from '../billing/billing.payment.controller'
import { BillingValidation } from '../billing/billing.validation'

const seller = Router()

const admin = Router()
admin.get('/businesses', BusinessesController.list)
admin.get('/businesses/:id', BusinessesController.getById)
admin.patch(
  '/businesses/:id/subscription',
  validateRequest(BillingValidation.updateSubscription),
  BusinessesController.updateSubscription,
)
admin.patch(
  '/businesses/:id/is-demo',
  validateRequest(BusinessesValidation.setIsDemo),
  BusinessesController.setIsDemo,
)
admin.get('/businesses/:id/payments', BillingPaymentController.list)
admin.post(
  '/businesses/:id/payments',
  validateRequest(BillingValidation.recordPayment),
  BillingPaymentController.record,
)
admin.post('/demo/reseed', BusinessesController.reseedDemo)

export const businessesRoutes = { seller, admin }
