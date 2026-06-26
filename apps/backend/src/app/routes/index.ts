import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { productsRoutes } from '../modules/products/products.routes'
import { customersRoutes } from '../modules/customers/customers.routes'
import { ordersRoutes } from '../modules/orders/orders.routes'
import { remittancesRoutes } from '../modules/remittances/remittances.routes'
import { financialsRoutes } from '../modules/financials/financials.routes'
import { teamRoutes } from '../modules/team/team.routes'
import { exportsRoutes } from '../modules/exports/exports.routes'
import { schedulesRoutes } from '../modules/schedules/schedules.routes'
import { supportRoutes } from '../modules/support/support.routes'
import aiRoutes from '../../ai/routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes.seller)
router.use('/customers', customersRoutes.seller)
router.use('/orders', ordersRoutes.seller)
router.use('/team', teamRoutes.seller)
router.use('/exports', exportsRoutes)
router.use('/schedules', schedulesRoutes)
router.use('/support', supportRoutes)
router.use('/ai', aiRoutes)
router.use('/remittances', remittancesRoutes.seller)
router.use('/', financialsRoutes.seller)

export default router
