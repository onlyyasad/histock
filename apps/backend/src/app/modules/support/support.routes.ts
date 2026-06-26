import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { SupportController } from './support.controller'
import { SupportValidation } from './support.validation'

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

// Admin support surface (inbox, status/priority) is added in the admin refactor.
const admin = Router()

export const supportRoutes = { seller, admin }
