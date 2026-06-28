import { Router } from 'express'
import { AuditController } from './audit.controller'

const seller = Router()

const admin = Router()
admin.get('/audit-log', AuditController.list)

export const auditRoutes = { seller, admin }
