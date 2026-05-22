import { RequestHandler } from 'express'
import { redis } from '../../shared/redis/client'

const SELLER_MAX_ATTEMPTS = 5
const ADMIN_MAX_ATTEMPTS = 3
const WINDOW_SECONDS = 15 * 60

const FORGOT_PW_IP_WINDOW = 60 * 60
const FORGOT_PW_IP_MAX = 5
const FORGOT_PW_EMAIL_WINDOW = 60 * 60 * 2
const FORGOT_PW_EMAIL_MAX = 3

export const loginRateLimit: RequestHandler = async (req, res, next) => {
  const ip = req.ip ?? 'unknown'
  const email = (req.body?.email ?? '').toLowerCase()
  const key = `login_attempts:${ip}:${email}`

  let maxAttempts = SELLER_MAX_ATTEMPTS
  try {
    const { prismaAdmin } = await import('../../prisma/client')
    const user = await prismaAdmin.user.findFirst({
      where: { email },
      select: { role: true },
    })
    if (user?.role === 'platform_admin') {
      maxAttempts = ADMIN_MAX_ATTEMPTS
    }
  } catch {
    // non-fatal — use seller limit
  }

  try {
    const attempts = await redis.incr(key)
    if (attempts === 1) {
      await redis.expire(key, WINDOW_SECONDS)
    }
    if (attempts > maxAttempts) {
      const ttl = await redis.ttl(key)
      return res.status(429).json({
        error: 'Too many login attempts',
        retryAfterSeconds: ttl,
      })
    }
  } catch {
    // Redis unavailable — fail open
  }
  next()
}

export async function clearLoginAttempts(ip: string, email: string) {
  const key = `login_attempts:${ip}:${email}`
  await redis.del(key).catch(() => {})
}

export const forgotPasswordRateLimit: RequestHandler = async (req, res, next) => {
  const ip = req.ip ?? 'unknown'
  const email =
    typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : 'unknown'

  try {
    const ipKey = `forgot_pw_attempts:ip:${ip}`
    const ipAttempts = await redis.incr(ipKey)
    if (ipAttempts === 1) await redis.expire(ipKey, FORGOT_PW_IP_WINDOW)
    if (ipAttempts > FORGOT_PW_IP_MAX) {
      return res.status(429).json({ error: 'Too many requests. Try again later.' })
    }

    const emailKey = `forgot_pw_attempts:email:${email}`
    const emailAttempts = await redis.incr(emailKey)
    if (emailAttempts === 1) await redis.expire(emailKey, FORGOT_PW_EMAIL_WINDOW)
    if (emailAttempts > FORGOT_PW_EMAIL_MAX) {
      return res.status(429).json({ error: 'Too many requests. Try again later.' })
    }
  } catch {
    // Redis unavailable — fail open
  }
  next()
}
