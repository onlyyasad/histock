import { Router } from 'express'
import { UserRole } from '@prisma/client'
import { requireSeller, requireRole } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { OrdersController } from './orders.controller'
import { OrderValidation } from './orders.validation'

const seller = Router()

// Specific paths before the `/:id` param route.
seller.get('/', requireSeller, OrdersController.list)
seller.get('/:id/cost-breakdown', requireSeller, OrdersController.getCostBreakdown)
seller.get('/:id', requireSeller, OrdersController.getById)
seller.post(
  '/',
  requireSeller,
  validateRequest(OrderValidation.createOrder),
  OrdersController.create,
)
seller.patch(
  '/:id/status',
  requireSeller,
  validateRequest(OrderValidation.updateStatus),
  OrdersController.updateStatus,
)
seller.patch('/:id/payment', requireSeller, OrdersController.confirmPayment)
seller.patch(
  '/:id',
  requireSeller,
  validateRequest(OrderValidation.updateMetadata),
  OrdersController.updateMetadata,
)
seller.delete(
  '/:id',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  OrdersController.remove,
)
seller.post(
  '/:id/notes',
  requireSeller,
  validateRequest(OrderValidation.addNote),
  OrdersController.addNote,
)

// Admin order surface (all-business — e.g. print all orders) is added in the admin refactor.
const admin = Router()

export const ordersRoutes = { seller, admin }
