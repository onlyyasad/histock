import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { sseManager } from '../../../shared/sse/manager'
import { SchedulesController } from './schedules.controller'
import { ScheduleValidation } from './schedules.validation'

const seller = Router()

seller.get(
  '/',
  requireSeller,
  validateRequest(ScheduleValidation.listSchedules),
  SchedulesController.list,
)
seller.post(
  '/',
  requireSeller,
  validateRequest(ScheduleValidation.createSchedule),
  SchedulesController.create,
)
seller.patch('/:id/done', requireSeller, SchedulesController.markDone)
seller.delete('/:id', requireSeller, SchedulesController.remove)

// SSE stream for browser tabs — raw streaming response, cannot use sendResponse.
// Lives here historically; URL stays /api/v1/schedules/sse.
seller.get('/sse', requireSeller, (req, res) => {
  const { businessId } = req.user as { businessId: string }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  sseManager.add(businessId, res)

  // 15-second heartbeat to keep the connection alive through proxies.
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch {
      clearInterval(heartbeat)
    }
  }, 15_000)

  const cleanup = () => {
    clearInterval(heartbeat)
    sseManager.remove(businessId, res)
  }

  req.on('close', cleanup)
  res.on('error', cleanup)
})

// Admin schedules surface is added in the admin refactor.
const admin = Router()

export const schedulesRoutes = { seller, admin }
