import { Router } from 'express'
import { loginRateLimit, forgotPasswordRateLimit } from '../../middlewares/bruteForce'
import { requireSeller, requireAdmin } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { AuthController } from './auth.controller'
import { AuthValidation } from './auth.validation'

const seller = Router()

seller.post('/register', validateRequest(AuthValidation.register), AuthController.register)
seller.post('/login', loginRateLimit, AuthController.login)
seller.post('/logout', requireSeller, AuthController.logout)
seller.get('/me', requireSeller, AuthController.me)
seller.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validateRequest(AuthValidation.forgotPassword),
  AuthController.forgotPassword,
)
seller.post(
  '/reset-password',
  validateRequest(AuthValidation.resetPassword),
  AuthController.resetPassword,
)
seller.post('/impersonate', validateRequest(AuthValidation.impersonate), AuthController.impersonate)
seller.post('/impersonate/end', requireSeller, AuthController.endImpersonation)

const admin = Router()
admin.get('/me', requireAdmin, AuthController.adminMe)
admin.post('/impersonate/:businessId', requireAdmin, AuthController.adminImpersonate)

export const authRoutes = { seller, admin }
