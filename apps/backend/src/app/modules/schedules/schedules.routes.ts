import { Router } from 'express'
import { z } from 'zod'
import { requireSeller } from '../../middlewares/auth'
import { prismaWithScope, prismaAdmin } from '../../../prisma/client'
import { sseManager } from '../../../shared/sse/manager'
import { scheduleQueue } from '../../../jobs/scheduleQueue'

const router = Router()

function getUser(req: Express.Request) {
  return req.user as { businessId: string; id: string }
}

// GET /api/v1/schedules?orderId=xxx — list schedules, optionally filtered by order
router.get('/', requireSeller, async (req, res, next) => {
  try {
    const { businessId } = getUser(req)
    const orderId = req.query.orderId as string | undefined

    const schedules = await prismaWithScope(businessId).schedule.findMany({
      where: orderId ? { orderId } : {},
      orderBy: { scheduledAt: 'asc' },
    })
    res.json(schedules)
  } catch (err) {
    next(err)
  }
})

const CreateScheduleSchema = z.object({
  title: z.string().min(1).max(255),
  scheduledAt: z.string().datetime(),
  orderId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
})

// POST /api/v1/schedules — create reminder
router.post('/', requireSeller, async (req, res, next) => {
  try {
    const { businessId } = getUser(req)
    const parsed = CreateScheduleSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const { title, scheduledAt, orderId, customerId } = parsed.data
    const scheduledDate = new Date(scheduledAt)

    const schedule = await prismaAdmin.schedule.create({
      data: {
        businessId,
        title,
        scheduledAt: scheduledDate,
        orderId: orderId ?? null,
        customerId: customerId ?? null,
      },
    })

    // Enqueue reminder job if scheduled in the future
    const delay = scheduledDate.getTime() - Date.now()
    if (delay > 0) {
      let orderNumber: number | null = null
      if (orderId) {
        const order = await prismaWithScope(businessId).order.findFirst({
          where: { id: orderId },
          select: { orderNumber: true },
        })
        orderNumber = order?.orderNumber ?? null
      }

      await scheduleQueue.add(
        'reminder',
        { scheduleId: schedule.id, businessId, title, orderId: orderId ?? null, orderNumber },
        { delay, jobId: `schedule:${schedule.id}` },
      )
    }

    res.status(201).json(schedule)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/schedules/:id/done — mark complete
router.patch('/:id/done', requireSeller, async (req, res, next) => {
  try {
    const { businessId } = getUser(req)
    const scheduleId = req.params.id as string

    const existing = await prismaWithScope(businessId).schedule.findFirst({
      where: { id: scheduleId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const updated = await prismaAdmin.schedule.update({
      where: { id: scheduleId },
      data: { isDone: true },
    })

    // Remove pending reminder job
    const job = await scheduleQueue.getJob(`schedule:${scheduleId}`)
    if (job) await job.remove()

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/schedules/:id — cancel/delete
router.delete('/:id', requireSeller, async (req, res, next) => {
  try {
    const { businessId } = getUser(req)
    const scheduleId = req.params.id as string

    const existing = await prismaWithScope(businessId).schedule.findFirst({
      where: { id: scheduleId },
    })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    await prismaAdmin.schedule.delete({ where: { id: scheduleId } })

    const job = await scheduleQueue.getJob(`schedule:${scheduleId}`)
    if (job) await job.remove()

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/sse — SSE stream for browser tabs (heartbeat + push events)
router.get('/sse', requireSeller, (req, res) => {
  const { businessId } = getUser(req)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  sseManager.add(businessId, res)

  // 15-second heartbeat to keep connection alive through proxies
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

export { router as schedulesRoutes }
