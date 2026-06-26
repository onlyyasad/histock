import { Queue, Worker, type Job } from 'bullmq'
import { redis } from '../shared/redis/client'
import { generateText } from '../shared/groq/client'
import { prismaAdmin } from '../prisma/client'

export const AI_QUEUE = 'ai-generation'

export const aiQueue = new Queue<AiJobData>(AI_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2, // 1 retry on failure
    backoff: { type: 'fixed', delay: 5_000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
})

export type AiJobData = {
  jobId: string // client-provided ID for polling
  type: 'product_description' | 'social_post'
  businessId: string
  payload: Record<string, string>
}

export type AiJobResult = {
  text: string
  tokenCount: number
  fallback: boolean // true if graceful degradation was used
}

// Store results in Redis for polling — expires after 5 minutes
async function storeResult(jobId: string, result: AiJobResult) {
  await redis.setex(`ai:result:${jobId}`, 5 * 60, JSON.stringify(result))
}

// Record usage in DB for reporting and Redis-down fallback
async function recordUsageInDb(businessId: string) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  await prismaAdmin.aiUsage.upsert({
    where: { businessId_date: { businessId, date: today } },
    create: { businessId, date: today, count: 1 },
    update: { count: { increment: 1 } },
  })
}

export const aiWorker = new Worker<AiJobData>(
  AI_QUEUE,
  async (job: Job<AiJobData>) => {
    const { type, payload, jobId, businessId } = job.data

    try {
      let prompt: string

      if (type === 'product_description') {
        prompt = buildProductDescriptionPrompt(payload)
      } else if (type === 'social_post') {
        prompt = buildSocialPostPrompt(payload)
      } else {
        throw new Error(`Unknown AI job type: ${type}`)
      }

      const result = await generateText(prompt)
      await storeResult(jobId, { ...result, fallback: false })
      await recordUsageInDb(businessId)
    } catch (err: unknown) {
      const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 2) - 1
      if (isLastAttempt) {
        // All retries exhausted — graceful degradation
        const fallbackText = getFallbackText(type, payload)
        await storeResult(jobId, { text: fallbackText, tokenCount: 0, fallback: true })
      } else {
        throw err // Rethrow to trigger BullMQ retry
      }
    }
  },
  { connection: redis, concurrency: 3 },
)

aiWorker.on('failed', (job, err) => {
  console.error(`[ai] Job ${job?.id} failed permanently:`, err.message)
})

function buildProductDescriptionPrompt(payload: Record<string, string>): string {
  return `Write a short, compelling product description for an online seller in Bangladesh.

Product name: ${payload.productName}
Category: ${payload.category ?? 'General'}
Key features: ${payload.features ?? 'Not specified'}

Write 2-3 sentences in English. Focus on quality and appeal. Do not include price or delivery info.`
}

function buildSocialPostPrompt(payload: Record<string, string>): string {
  const platform = payload.platform === 'facebook' ? 'Facebook' : 'WhatsApp'
  return `Write a ${platform} post for a small seller in Bangladesh promoting this product.

Product: ${payload.productName}
Price: ${payload.price ?? 'Contact for price'}
Key benefit: ${payload.benefit ?? 'Quality product'}

Keep it casual and friendly. Use 1-2 emojis. 3-5 sentences max. Write in English.`
}

function getFallbackText(type: string, payload: Record<string, string>): string {
  if (type === 'product_description') {
    return `${payload.productName} — high-quality product available now. Contact us to order.`
  }
  return `🛍️ Check out our ${payload.productName}! Great quality at the best price. DM us to order!`
}
