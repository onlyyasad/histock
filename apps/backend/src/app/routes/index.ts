import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { productsRoutes } from '../modules/products/products.routes'
import { customersRoutes } from '../modules/customers/customers.routes'
import { ordersRoutes } from '../modules/orders/orders.routes'
import { financialsRoutes } from '../modules/financials/financials.routes'
import { teamRoutes } from '../modules/team/team.routes'
import { exportsRoutes } from '../modules/exports/exports.routes'
import { schedulesRoutes } from '../modules/schedules/schedules.routes'
import { settingsRoutes } from '../modules/settings/settings.routes'
import { supportRoutes } from '../modules/support/support.routes'
import aiRoutes from '../../ai/routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productsRoutes)
router.use('/customers', customersRoutes.seller)
router.use('/orders', ordersRoutes)
router.use('/team', teamRoutes)
router.use('/exports', exportsRoutes)
router.use('/schedules', schedulesRoutes)
router.use('/settings', settingsRoutes)
router.use('/support', supportRoutes)
router.use('/ai', aiRoutes)
router.use('/', financialsRoutes)

export default router
