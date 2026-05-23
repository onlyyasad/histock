import crypto from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { passport } from './passport'
import { loginRateLimit, clearLoginAttempts, forgotPasswordRateLimit } from '../../middlewares/bruteForce'
import { requireSeller } from '../../middlewares/auth'
import { prismaAdmin } from '../../../prisma/client'
import { sendPasswordResetEmail } from '../../../shared/email/client'
import config from '../../../config'

const router = Router()

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

const RegisterSchema = z.object({
  businessName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(200),
})

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() })
    }

    const { businessName, email, password, name } = parsed.data

    const existing = await prismaAdmin.user.findFirst({
      where: { email: email.toLowerCase() },
    })
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const slug =
      businessName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') + `-${Date.now()}`

    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const business = await prismaAdmin.business.create({
      data: {
        name: businessName,
        slug,
        subscription: {
          create: {
            planId: 'growth',
            status: 'trial',
            billingAnchorDate: now,
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            trialEndsAt: trialEnd,
          },
        },
        emailPreferences: { create: {} },
        users: {
          create: {
            email: email.toLowerCase(),
            passwordHash,
            name,
            role: 'owner',
          },
        },
      },
      include: { users: true },
    })

    const user = business.users[0]
    req.login(user, (err) => {
      if (err) return next(err)
      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: business.id,
        businessName: business.name,
      })
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/login
router.post('/login', loginRateLimit, (req, res, next) => {
  passport.authenticate('local', async (err: unknown, user: Record<string, unknown> | false, info: { message?: string }) => {
    if (err) return next(err)
    if (!user) {
      return res.status(401).json({ error: info?.message ?? 'Invalid credentials' })
    }

    req.login(user as Express.User, async (loginErr) => {
      if (loginErr) return next(loginErr)

      await clearLoginAttempts(req.ip ?? '', req.body.email ?? '')

      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        businessName: (user.business as Record<string, unknown> | null)?.name ?? null,
      })
    })
  })(req, res, next)
})

// POST /api/v1/auth/logout
router.post('/logout', requireSeller, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err)
    req.session.destroy(() => {
      res.clearCookie('connect.sid')
      res.json({ ok: true })
    })
  })
})

// GET /api/v1/auth/me
router.get('/me', requireSeller, (req, res) => {
  const user = req.user as Record<string, unknown>
  const business = user.business as Record<string, unknown> | null
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.businessId,
    businessName: business?.name ?? null,
    isDemo: business?.isDemo ?? false,
  })
})

// POST /api/v1/auth/forgot-password
// Always returns 200 — never reveals whether the email exists.
router.post('/forgot-password', forgotPasswordRateLimit, async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email required' })
    }

    const user = await prismaAdmin.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      select: { id: true, email: true },
    })

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

      await prismaAdmin.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      })

      await prismaAdmin.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      })

      const resetUrl = `${config.frontend_url}/reset-password?token=${rawToken}`
      await sendPasswordResetEmail(user.email, resetUrl)
    }

    res.json({ ok: true, message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body

    if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'token and password are required' })
    }
    if (password.length < 8 || password.length > 100) {
      return res.status(400).json({ error: 'Password must be 8–100 characters' })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const record = await prismaAdmin.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired reset link' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prismaAdmin.$transaction([
      prismaAdmin.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prismaAdmin.user.update({
        where: { id: record.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
    ])

    res.json({ ok: true, message: 'Password updated. You can now log in.' })
  } catch (err) {
    next(err)
  }
})

export { router as authRoutes }
