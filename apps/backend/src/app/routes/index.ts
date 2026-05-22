import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'

const router = Router()

router.use('/auth', authRoutes)

// Additional modules wired here as they are implemented:
// router.use('/orders', ordersRouter)
// router.use('/customers', customersRouter)
// router.use('/products', productsRouter)

export default router
