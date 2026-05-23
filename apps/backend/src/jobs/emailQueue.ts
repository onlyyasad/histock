import { Queue, Worker, type Job } from 'bullmq'
import { redis } from '../shared/redis/client'
import { sendOrderStatusEmail, sendTrialExpiryEmail } from '../shared/email/client'

export const EMAIL_QUEUE = 'email'

export type EmailJobData =
  | {
      type: 'order_status'
      orderId: string
      orderNumber: number
      newStatus: string
      recipientEmail: string
      recipientName: string
    }
  | {
      type: 'trial_expiry'
      daysLeft: number
      recipientEmail: string
      recipientName: string
    }

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE,
  async (job: Job<EmailJobData>) => {
    const { data } = job

    switch (data.type) {
      case 'order_status':
        await sendOrderStatusEmail(
          data.recipientEmail,
          data.recipientName,
          data.orderNumber,
          data.newStatus,
        )
        break

      case 'trial_expiry':
        await sendTrialExpiryEmail(data.recipientEmail, data.recipientName, data.daysLeft)
        break
    }
  },
  { connection: redis, concurrency: 5 },
)

emailWorker.on('failed', (job, err) => {
  console.error(
    `[email] job ${job?.id} (${(job?.data as EmailJobData | undefined)?.type}) failed after ${job?.attemptsMade} attempts:`,
    err.message,
  )
})
