import { Router } from 'express'
import { authRoutes } from '../modules/auth/auth.routes'
import { productsRoutes } from '../modules/products/products.routes'
import { customersRoutes } from '../modules/customers/customers.routes'
import { ordersRoutes } from '../modules/orders/orders.routes'
// NOTE: `costs` is a service-only module (no router) — intentionally not imported.
import { remittancesRoutes } from '../modules/remittances/remittances.routes'
import { couriersRoutes } from '../modules/couriers/couriers.routes'
import { teamRoutes } from '../modules/team/team.routes'
import { schedulesRoutes } from '../modules/schedules/schedules.routes'
import { supportRoutes } from '../modules/support/support.routes'
import { exportsRoutes } from '../modules/exports/exports.routes'
import { aiRoutes } from '../modules/ai/ai.routes'
import { financialsRoutes } from '../modules/financials/financials.routes'

const router = Router()

type ModuleRoute = { path: string; route: Router }

// Seller-facing module routers. Admin routers (the `.admin` half of each module)
// are mounted under /api/v1/admin during the separate admin refactor.
const moduleRoutes: ModuleRoute[] = [
  { path: '/auth', route: authRoutes.seller },
  { path: '/products', route: productsRoutes.seller },
  { path: '/customers', route: customersRoutes.seller },
  { path: '/orders', route: ordersRoutes.seller },
  { path: '/remittances', route: remittancesRoutes.seller },
  { path: '/couriers', route: couriersRoutes.seller },
  { path: '/team', route: teamRoutes.seller },
  { path: '/schedules', route: schedulesRoutes.seller },
  { path: '/support', route: supportRoutes.seller },
  { path: '/exports', route: exportsRoutes.seller },
  { path: '/ai', route: aiRoutes.seller },
  // Financials uses root-level paths (/dashboard, /analytics/profit-loss) — mount LAST.
  { path: '/', route: financialsRoutes.seller },
]

moduleRoutes.forEach(({ path, route }) => router.use(path, route))

export default router
