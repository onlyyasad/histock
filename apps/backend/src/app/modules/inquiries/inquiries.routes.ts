import { Router } from 'express'
import validateRequest from '../../middlewares/validateRequest'
import { InquiriesController } from './inquiries.controller'
import { InquiriesValidation } from './inquiries.validation'

const seller = Router()

const admin = Router()
admin.get('/inquiries', InquiriesController.list)
admin.get('/inquiries/:id', InquiriesController.getById)
admin.patch('/inquiries/:id', validateRequest(InquiriesValidation.update), InquiriesController.update)
admin.get('/inquiries/:id/stream', InquiriesController.stream)

export const inquiriesRoutes = { seller, admin }
