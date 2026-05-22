import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { productsRoutes } from '../modules/products/products.routes'
import { customersRoutes } from '../modules/customers/customers.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes)
router.use('/customers', customersRoutes)

// Additional modules wired here as they are implemented:
// router.use('/orders', ordersRouter)

export default router
