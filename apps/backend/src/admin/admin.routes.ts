import { Router } from 'express'
import { z } from 'zod'
import type { InquiryStatus, SubscriptionStatus } from '@prisma/client'
import { requireAdmin } from '../app/middlewares/auth'
import { prismaAdmin } from '../prisma/client'
import { auditMiddleware } from './audit.middleware'
import { AdminBusinessService } from './businesses.service'
import { InquiryService } from './inquiries.service'
import { getAllPlans, updatePlan } from './subscriptionPlans.service'

const router = Router()

router.use(requireAdmin)
router.use(auditMiddleware)

const businessService = new AdminBusinessService()
const inquiryService = new InquiryService()

// ── Businesses ──────────────────────────────────────────────────────────────

router.get('/businesses', async (req, res, next) => {
  try {
    const { search, planId, page } = req.query
    const businesses = await businessService.list({
      search: search as string | undefined,
      planId: planId as string | undefined,
      page: page ? Number(page) : 1,
    })
    res.json(businesses)
  } catch (err) {
    next(err)
  }
})

router.get('/businesses/:id', async (req, res, next) => {
  try {
    const business = await businessService.getById(req.params.id as string)
    if (!business) return res.status(404).json({ error: 'Not found' })
    res.json(business)
  } catch (err) {
    next(err)
  }
})

router.patch('/businesses/:id/subscription', async (req, res, next) => {
  try {
    const schema = z.object({
      planId: z.string().optional(),
      status: z.enum(['trial', 'active', 'grace_period', 'expired', 'cancelled']).optional(),
      currentPeriodEnd: z.string().datetime().optional(),
      adminNotes: z.string().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const sub = await businessService.updateSubscription(req.params.id as string, {
      ...parsed.data,
      status: parsed.data.status as SubscriptionStatus | undefined,
    })
    res.json(sub)
  } catch (err) {
    next(err)
  }
})

router.patch('/businesses/:id/is-demo', async (req, res, next) => {
  try {
    const parsed = z.object({ isDemo: z.boolean() }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })
    const business = await businessService.setIsDemo(req.params.id as string, parsed.data.isDemo)
    res.json(business)
  } catch (err) {
    next(err)
  }
})

// ── Subscription Plans ───────────────────────────────────────────────────────

router.get('/subscription-plans', async (_req, res, next) => {
  try {
    res.json(await getAllPlans())
  } catch (err) {
    next(err)
  }
})

router.patch('/subscription-plans/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      priceMonthly: z.number().nonnegative().optional(),
      maxUsers: z.number().int().positive().nullable().optional(),
      maxOrdersPerMonth: z.number().int().positive().nullable().optional(),
      maxProducts: z.number().int().positive().nullable().optional(),
      maxSkus: z.number().int().positive().nullable().optional(),
      isActive: z.boolean().optional(),
      displayOrder: z.number().int().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })
    res.json(await updatePlan(req.params.id as string, parsed.data))
  } catch (err) {
    next(err)
  }
})

// ── Audit Log ───────────────────────────────────────────────────────────────

router.get('/audit-log', async (req, res, next) => {
  try {
    const { businessId, page } = req.query
    const limit = 50
    const pageNum = page ? Number(page) : 1
    const logs = await prismaAdmin.adminAuditLog.findMany({
      where: { ...(businessId ? { targetBusinessId: businessId as string } : {}) },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limit,
      take: limit,
    })
    res.json(logs)
  } catch (err) {
    next(err)
  }
})

// ── Inquiries ───────────────────────────────────────────────────────────────

router.get('/inquiries', async (req, res, next) => {
  try {
    res.json(await inquiryService.list(req.query.status as InquiryStatus | undefined))
  } catch (err) {
    next(err)
  }
})

router.get('/inquiries/:id', async (req, res, next) => {
  try {
    const inquiry = await inquiryService.getById(req.params.id as string)
    if (!inquiry) return res.status(404).json({ error: 'Not found' })
    res.json(inquiry)
  } catch (err) {
    next(err)
  }
})

router.patch('/inquiries/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      action: z.enum(['reply', 'resolve']),
      content: z.string().min(1).optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    if (parsed.data.action === 'reply') {
      if (!parsed.data.content)
        return res.status(400).json({ error: 'content required for reply' })
      return res.json(await inquiryService.reply(req.params.id as string, parsed.data.content))
    }
    res.json(await inquiryService.resolve(req.params.id as string))
  } catch (err) {
    next(err)
  }
})

// SSE for real-time inquiry chat — 15s heartbeat, 30s stale timeout
router.get('/inquiries/:id/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let closed = false

  const heartbeat = setInterval(() => {
    if (!closed) res.write('event: heartbeat\ndata: {}\n\n')
  }, 15_000)

  const staleTimer = setTimeout(() => {
    closed = true
    res.write('event: close\ndata: {"reason":"stale"}\n\n')
    cleanup()
    res.end()
  }, 30_000)

  function cleanup() {
    closed = true
    clearInterval(heartbeat)
    clearTimeout(staleTimer)
  }

  req.on('close', cleanup)
  res.on('error', cleanup)

  inquiryService
    .getById(req.params.id as string)
    .then((inquiry) => {
      if (inquiry && !closed) res.write(`event: init\ndata: ${JSON.stringify(inquiry)}\n\n`)
    })
    .catch(() => {})
})

export { router as adminRoutes }
