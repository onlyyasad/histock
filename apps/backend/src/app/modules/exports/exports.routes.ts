import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import { ExportsController } from './exports.controller'

const seller = Router()

seller.get('/orders', requireSeller, ExportsController.exportOrders)
seller.get('/customers', requireSeller, ExportsController.exportCustomers)
seller.get('/products', requireSeller, ExportsController.exportProducts)

// Admin export surface is added in the admin refactor.
const admin = Router()

export const exportsRoutes = { seller, admin }
