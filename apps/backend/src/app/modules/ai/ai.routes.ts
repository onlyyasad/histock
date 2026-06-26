import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { AiController } from './ai.controller'
import { AiValidation } from './ai.validation'

const seller = Router()

seller.get('/usage', requireSeller, AiController.getUsage)
seller.post('/generate', requireSeller, validateRequest(AiValidation.generate), AiController.generate)
seller.get('/result/:jobId', requireSeller, AiController.getResult)

// Admin AI surface (if any) is added in the admin refactor.
const admin = Router()

export const aiRoutes = { seller, admin }
