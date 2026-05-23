import { Queue, Worker, type Job } from 'bullmq'
import { redis } from '../shared/redis/client'
import { sseManager } from '../shared/sse/manager'

const QUEUE_NAME = 'schedule-reminder'

export interface ScheduleJobData {
  scheduleId: string
  businessId: string
  title: string
  orderId: string | null
  orderNumber: number | null
}

export const scheduleQueue = new Queue<ScheduleJobData>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 50, removeOnFail: 100 },
})

export const scheduleWorker = new Worker<ScheduleJobData>(
  QUEUE_NAME,
  async (job: Job<ScheduleJobData>) => {
    const { businessId, title, orderId, orderNumber } = job.data
    sseManager.push(businessId, 'reminder', {
      title,
      orderId,
      orderNumber,
    })
  },
  { connection: redis, concurrency: 10 },
)

scheduleWorker.on('failed', (job, err) => {
  console.error(`[schedule-reminder] job ${job?.id} failed:`, err.message)
})
