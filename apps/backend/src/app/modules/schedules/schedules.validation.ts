import { z } from 'zod'

const listSchedules = z.object({
  query: z.object({
    orderId: z.string().uuid().optional(),
  }),
})

const createSchedule = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    scheduledAt: z.string().datetime(),
    orderId: z.string().uuid().nullable().optional(),
    customerId: z.string().uuid().nullable().optional(),
  }),
})

export const ScheduleValidation = {
  listSchedules,
  createSchedule,
}
