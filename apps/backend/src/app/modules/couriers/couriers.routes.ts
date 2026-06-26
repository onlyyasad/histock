import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import { CouriersController } from './couriers.controller'

const seller = Router()

seller.get('/', requireSeller, CouriersController.list)

// Admin courier management (create/update/deactivate) is added in the admin refactor.
const admin = Router()

export const couriersRoutes = { seller, admin }
