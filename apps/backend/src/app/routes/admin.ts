import { Router } from 'express'
import { requireAdmin } from '../middlewares/auth'
import { auditMiddleware } from '../modules/audit/audit.middleware'
import { authRoutes } from '../modules/auth/auth.routes'
import { businessesRoutes } from '../modules/businesses/businesses.routes'
import { billingRoutes } from '../modules/billing/billing.routes'
import { auditRoutes } from '../modules/audit/audit.routes'
import { inquiriesRoutes } from '../modules/inquiries/inquiries.routes'
import { supportRoutes } from '../modules/support/support.routes'

const router = Router()

router.use(requireAdmin)
router.use(auditMiddleware)

// Each module's admin router defines its own full sub-paths (e.g. /businesses, /me).
router.use(authRoutes.admin)
router.use(businessesRoutes.admin)
router.use(billingRoutes.admin)
router.use(auditRoutes.admin)
router.use(inquiriesRoutes.admin)
router.use(supportRoutes.admin)

export default router
