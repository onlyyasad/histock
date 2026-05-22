import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { productsRoutes } from '../modules/products/products.routes'
import { customersRoutes } from '../modules/customers/customers.routes'
import { ordersRoutes } from '../modules/orders/orders.routes'
import { financialsRoutes } from '../modules/financials/financials.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes)
router.use('/customers', customersRoutes)
router.use('/orders', ordersRoutes)
router.use('/', financialsRoutes)

export default router
