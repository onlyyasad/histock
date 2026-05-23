import { redis } from '../shared/redis/client'
import { prismaAdmin } from '../prisma/client'

function getRedisKey(businessId: string): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `ai:usage:${businessId}:${date}`
}

async function getCountFromDb(businessId: string): Promise<number> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const record = await prismaAdmin.aiUsage.findFirst({
    where: { businessId, date: today },
    select: { count: true },
  })
  return record?.count ?? 0
}

export async function checkAndIncrementUsage(
  businessId: string,
  dailyLimit: number,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (dailyLimit === 0) return { allowed: false, used: 0, limit: 0 }

  const key = getRedisKey(businessId)
  let used: number

  try {
    used = await redis.incr(key)

    // Set TTL on first use (25 hours to cover timezone drift)
    if (used === 1) {
      await redis.expire(key, 25 * 60 * 60)
    }

    if (used > dailyLimit) {
      await redis.decr(key)
      return { allowed: false, used: used - 1, limit: dailyLimit }
    }
  } catch {
    // Redis unavailable — fall back to DB count
    const dbCount = await getCountFromDb(businessId)
    if (dbCount >= dailyLimit) {
      return { allowed: false, used: dbCount, limit: dailyLimit }
    }
    used = dbCount + 1
  }

  return { allowed: true, used, limit: dailyLimit }
}

export async function getUsage(
  businessId: string,
  dailyLimit: number,
): Promise<{ used: number; limit: number }> {
  const key = getRedisKey(businessId)

  try {
    const cached = await redis.get(key)
    const used = cached ? parseInt(cached, 10) : await getCountFromDb(businessId)
    return { used, limit: dailyLimit }
  } catch {
    const used = await getCountFromDb(businessId)
    return { used, limit: dailyLimit }
  }
}
