import { Router } from 'express'
import { UserRole } from '@prisma/client'
import { requireSeller, requireRole } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { ProductsController } from './products.controller'
import { ProductValidation } from './products.validation'

const seller = Router()

seller.get('/:id', requireSeller, ProductsController.getById)
seller.get('/', requireSeller, ProductsController.list)
seller.post(
  '/',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  validateRequest(ProductValidation.createProduct),
  ProductsController.create,
)
seller.patch(
  '/:id',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  validateRequest(ProductValidation.updateProduct),
  ProductsController.update,
)
seller.delete(
  '/:id',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  ProductsController.remove,
)
seller.post(
  '/:id/variants',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  validateRequest(ProductValidation.createVariant),
  ProductsController.createVariant,
)
seller.post(
  '/:id/cost-entries',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  validateRequest(ProductValidation.createCostEntry),
  ProductsController.createCostEntry,
)

// Admin product surface (all-business) is added in the admin refactor.
const admin = Router()

export const productsRoutes = { seller, admin }
