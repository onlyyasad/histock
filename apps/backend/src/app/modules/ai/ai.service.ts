import { randomUUID } from 'crypto'
import httpStatus from 'http-status'
import { redis } from '../../../shared/redis/client'
import { prismaAdmin } from '../../../prisma/client'
import { aiQueue } from '../../../jobs/aiQueue'
import ApiError from '../../../errors/ApiError'
import { AI_USAGE_TTL_SECONDS, AI_LIMIT_REACHED, aiUsageKey, aiResultKey } from './ai.constants'
import type { IGenerateInput } from './ai.interface'

const todayStamp = () => new Date().toISOString().slice(0, 10)

const getDailyLimit = async (businessId: string): Promise<number> => {
  const sub = await prismaAdmin.subscription.findFirst({
    where: { businessId },
    include: { plan: { select: { aiGenerationsPerDay: true } } },
  })
  return sub?.plan.aiGenerationsPerDay ?? 0
}

const getCountFromDb = async (businessId: string): Promise<number> => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const record = await prismaAdmin.aiUsage.findFirst({
    where: { businessId, date: today },
    select: { count: true },
  })
  return record?.count ?? 0
}

const getUsage = async (businessId: string, dailyLimit: number) => {
  const key = aiUsageKey(businessId, todayStamp())
  try {
    const cached = await redis.get(key)
    const used = cached ? parseInt(cached, 10) : await getCountFromDb(businessId)
    return { used, limit: dailyLimit }
  } catch {
    const used = await getCountFromDb(businessId)
    return { used, limit: dailyLimit }
  }
}

const checkAndIncrementUsage = async (businessId: string, dailyLimit: number) => {
  if (dailyLimit === 0) return { allowed: false, used: 0, limit: 0 }

  const key = aiUsageKey(businessId, todayStamp())
  let used: number

  try {
    used = await redis.incr(key)
    if (used === 1) {
      await redis.expire(key, AI_USAGE_TTL_SECONDS)
    }
    if (used > dailyLimit) {
      await redis.decr(key)
      return { allowed: false, used: used - 1, limit: dailyLimit }
    }
  } catch {
    const dbCount = await getCountFromDb(businessId)
    if (dbCount >= dailyLimit) {
      return { allowed: false, used: dbCount, limit: dailyLimit }
    }
    used = dbCount + 1
  }

  return { allowed: true, used, limit: dailyLimit }
}

const getUsageSummary = async (businessId: string) => {
  const dailyLimit = await getDailyLimit(businessId)
  const { used, limit } = await getUsage(businessId, dailyLimit)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

const generate = async (businessId: string, input: IGenerateInput) => {
  const dailyLimit = await getDailyLimit(businessId)
  const { allowed, used, limit } = await checkAndIncrementUsage(businessId, dailyLimit)

  if (!allowed) {
    const message =
      limit === 0
        ? 'AI features are not available on the Starter plan. Upgrade to Growth to use AI generation.'
        : `Daily AI limit reached (${used}/${limit}). Resets at midnight UTC.`
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, message, { code: AI_LIMIT_REACHED })
  }

  const jobId = randomUUID()
  await aiQueue.add(`${input.type}-${businessId}`, {
    jobId,
    type: input.type,
    businessId,
    payload: input.payload,
  })

  return { jobId }
}

const getResult = async (jobId: string) => {
  const raw = await redis.get(aiResultKey(jobId))
  if (!raw) {
    return { status: 'pending' as const }
  }
  const result = JSON.parse(raw)
  return { status: 'done' as const, ...result }
}

export const AiService = {
  getUsageSummary,
  generate,
  getResult,
}
