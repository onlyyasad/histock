import { Router } from 'express'
import { requireSeller, requireRole } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { CustomersController } from './customers.controller'
import { CustomerValidation } from './customers.validation'

const seller = Router()

// NOTE: /lookup is declared before /:id so it is not captured by the param route.
seller.get('/', requireSeller, CustomersController.list)
seller.get(
  '/lookup',
  requireSeller,
  validateRequest(CustomerValidation.lookupByPhone),
  CustomersController.lookupByPhone,
)
seller.get('/:id', requireSeller, CustomersController.getById)
seller.post(
  '/',
  requireSeller,
  validateRequest(CustomerValidation.createCustomer),
  CustomersController.create,
)
seller.patch(
  '/:id',
  requireSeller,
  validateRequest(CustomerValidation.updateCustomer),
  CustomersController.update,
)
seller.delete('/:id', requireSeller, requireRole('owner', 'manager'), CustomersController.remove)
seller.post(
  '/:id/addresses',
  requireSeller,
  validateRequest(CustomerValidation.createAddress),
  CustomersController.addAddress,
)
seller.patch(
  '/:id/addresses/:addressId',
  requireSeller,
  validateRequest(CustomerValidation.updateAddress),
  CustomersController.updateAddress,
)
seller.post(
  '/:id/flag',
  requireSeller,
  validateRequest(CustomerValidation.flagCustomer),
  CustomersController.flag,
)
seller.delete('/:id/flag', requireSeller, CustomersController.unflag)

// Admin customer surface (all-business, prismaAdmin) is added in the admin refactor.
const admin = Router()

export const customersRoutes = { seller, admin }
