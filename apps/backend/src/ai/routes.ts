import { Router } from 'express'
import { randomUUID } from 'crypto'
import { requireSeller } from '../app/middlewares/auth'
import { checkAndIncrementUsage, getUsage } from './usageCounter'
import { aiQueue } from '../jobs/aiQueue'
import { redis } from '../shared/redis/client'
import { prismaAdmin } from '../prisma/client'

const router = Router()
router.use(requireSeller)

async function getAiDailyLimit(businessId: string): Promise<number> {
  const sub = await prismaAdmin.subscription.findFirst({
    where: { businessId },
    include: { plan: { select: { aiGenerationsPerDay: true } } },
  })
  return sub?.plan.aiGenerationsPerDay ?? 0
}

// GET /api/v1/ai/usage
router.get('/usage', async (req, res, next) => {
  try {
    const { businessId } = req.user as { businessId: string }
    const dailyLimit = await getAiDailyLimit(businessId)
    const { used, limit } = await getUsage(businessId, dailyLimit)
    res.json({ used, limit, remaining: Math.max(0, limit - used) })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/ai/generate
router.post('/generate', async (req, res, next) => {
  try {
    const { businessId } = req.user as { businessId: string }
    const { type, payload } = req.body as {
      type: 'product_description' | 'social_post'
      payload: Record<string, string>
    }

    if (!type || !payload) {
      return res.status(400).json({ error: 'type and payload are required' })
    }

    const dailyLimit = await getAiDailyLimit(businessId)
    const { allowed, used, limit } = await checkAndIncrementUsage(businessId, dailyLimit)

    if (!allowed) {
      return res.status(402).json({
        error:
          limit === 0
            ? 'AI features are not available on the Starter plan. Upgrade to Growth to use AI generation.'
            : `Daily AI limit reached (${used}/${limit}). Resets at midnight UTC.`,
        code: 'AI_LIMIT_REACHED',
      })
    }

    const jobId = randomUUID()
    await aiQueue.add(`${type}-${businessId}`, { jobId, type, businessId, payload })

    res.status(202).json({ jobId })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/ai/result/:jobId
router.get('/result/:jobId', async (req, res, next) => {
  try {
    const raw = await redis.get(`ai:result:${req.params.jobId}`)

    if (!raw) {
      return res.json({ status: 'pending' })
    }

    const result = JSON.parse(raw)
    res.json({ status: 'done', ...result })
  } catch (err) {
    next(err)
  }
})

export default router
