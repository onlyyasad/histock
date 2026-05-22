import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { productsRoutes } from '../modules/products/products.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes)

// Additional modules wired here as they are implemented:
// router.use('/orders', ordersRouter)
// router.use('/customers', customersRouter)

export default router
