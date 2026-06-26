import type { Schedule } from '@prisma/client'
import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import type { ScopedPrisma } from '../../../prisma/types'
import ApiError from '../../../errors/ApiError'
import { scheduleQueue } from '../../../jobs/scheduleQueue'
import { REMINDER_JOB_NAME, scheduleJobId } from './schedules.constants'
import type { ICreateScheduleInput } from './schedules.interface'

const list = (db: ScopedPrisma, orderId?: string) =>
  db.schedule.findMany({ where: orderId ? { orderId } : {}, orderBy: { scheduledAt: 'asc' } })

// Enqueue a delayed reminder job for a future-dated schedule (no-op if in the past).
const enqueueReminder = async (
  db: ScopedPrisma,
  businessId: string,
  schedule: Schedule,
  scheduledDate: Date,
  orderId: string | null,
) => {
  const delay = scheduledDate.getTime() - Date.now()
  if (delay <= 0) return

  let orderNumber: number | null = null
  if (orderId) {
    const order = await db.order.findFirst({ where: { id: orderId }, select: { orderNumber: true } })
    orderNumber = order?.orderNumber ?? null
  }

  await scheduleQueue.add(
    REMINDER_JOB_NAME,
    { scheduleId: schedule.id, businessId, title: schedule.title, orderId, orderNumber },
    { delay, jobId: scheduleJobId(schedule.id) },
  )
}

const removeReminderJob = async (scheduleId: string) => {
  const job = await scheduleQueue.getJob(scheduleJobId(scheduleId))
  if (job) await job.remove()
}

const create = async (db: ScopedPrisma, businessId: string, input: ICreateScheduleInput) => {
  const scheduledDate = new Date(input.scheduledAt)
  const orderId = input.orderId ?? null

  const schedule = await prismaAdmin.schedule.create({
    data: {
      businessId,
      title: input.title,
      scheduledAt: scheduledDate,
      orderId,
      customerId: input.customerId ?? null,
    },
  })

  await enqueueReminder(db, businessId, schedule, scheduledDate, orderId)
  return schedule
}

const markDone = async (db: ScopedPrisma, scheduleId: string) => {
  const existing = await db.schedule.findFirst({ where: { id: scheduleId } })
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Schedule not found')
  }
  const updated = await prismaAdmin.schedule.update({
    where: { id: scheduleId },
    data: { isDone: true },
  })
  await removeReminderJob(scheduleId)
  return updated
}

const remove = async (db: ScopedPrisma, scheduleId: string) => {
  const existing = await db.schedule.findFirst({ where: { id: scheduleId } })
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Schedule not found')
  }
  await prismaAdmin.schedule.delete({ where: { id: scheduleId } })
  await removeReminderJob(scheduleId)
}

export const SchedulesService = {
  list,
  create,
  markDone,
  remove,
}
