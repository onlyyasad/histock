import { Router } from 'express'
import { requireSeller, requireAdmin } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { SupportController } from './support.controller'
import { SupportValidation } from './support.validation'
import { SupportAdminController } from './support.admin.controller'
import { SupportAdminValidation } from './support.admin.validation'

const seller = Router()

seller.get('/', requireSeller, SupportController.list)
seller.post(
  '/',
  requireSeller,
  validateRequest(SupportValidation.createTicket),
  SupportController.create,
)
seller.get('/:id', requireSeller, SupportController.getById)
seller.post(
  '/:id/messages',
  requireSeller,
  validateRequest(SupportValidation.addMessage),
  SupportController.addMessage,
)

const admin = Router()
admin.get('/support-tickets', requireAdmin, SupportAdminController.list)
admin.get('/support-tickets/:id', requireAdmin, SupportAdminController.getById)
admin.post(
  '/support-tickets/:id/messages',
  requireAdmin,
  validateRequest(SupportAdminValidation.addMessage),
  SupportAdminController.addMessage,
)
admin.patch(
  '/support-tickets/:id',
  requireAdmin,
  validateRequest(SupportAdminValidation.setStatus),
  SupportAdminController.setStatus,
)

export const supportRoutes = { seller, admin }
