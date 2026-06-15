import crypto from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import type { InquiryStatus, SubscriptionStatus, TicketStatus } from '@prisma/client'
import { requireAdmin } from '../app/middlewares/auth'
import { prismaAdmin } from '../prisma/client'
import { auditMiddleware } from './audit.middleware'
import { AdminBusinessService } from './businesses.service'
import { InquiryService } from './inquiries.service'
import { SupportTicketService } from './supportTickets.service'
import { getAllPlans, updatePlan } from './subscriptionPlans.service'

const router = Router()

router.use(requireAdmin)
router.use(auditMiddleware)

const businessService = new AdminBusinessService()
const inquiryService = new InquiryService()
const supportTicketService = new SupportTicketService()

// ── Me ──────────────────────────────────────────────────────────────────────

router.get('/me', (req, res) => {
  const user = req.user as { id: string; name: string; email: string }
  res.json({ id: user.id, name: user.name, email: user.email, role: 'platform_admin' })
})

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

// ── Subscription Payments ────────────────────────────────────────────────────

// GET /api/v1/admin/businesses/:id/payments
router.get('/businesses/:id/payments', async (req, res, next) => {
  try {
    const payments = await prismaAdmin.subscriptionPayment.findMany({
      where: { businessId: req.params.id as string },
      orderBy: { createdAt: 'desc' },
    })
    res.json(payments)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/admin/businesses/:id/payments
// Records a manual payment (bKash / bank transfer) and activates the subscription.
router.post('/businesses/:id/payments', async (req, res, next) => {
  try {
    const schema = z.object({
      planId: z.string().min(1),
      amountPaid: z.number().positive(),
      paymentMethod: z.string().min(1),
      paymentRef: z.string().optional(),
      periodStart: z.string().datetime(),
      periodEnd: z.string().datetime(),
      notes: z.string().optional(),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const business = await prismaAdmin.business.findUnique({
      where: { id: req.params.id as string },
      include: { subscription: true },
    })
    if (!business) return res.status(404).json({ error: 'Business not found' })
    if (!business.subscription) return res.status(404).json({ error: 'No subscription found for this business' })

    const admin = req.user as { id: string }

    const payment = await prismaAdmin.$transaction(async (tx) => {
      const p = await tx.subscriptionPayment.create({
        data: {
          businessId: business.id,
          subscriptionId: business.subscription!.id,
          planId: parsed.data.planId,
          amountPaid: parsed.data.amountPaid,
          paymentMethod: parsed.data.paymentMethod,
          paymentRef: parsed.data.paymentRef ?? null,
          periodStart: new Date(parsed.data.periodStart),
          periodEnd: new Date(parsed.data.periodEnd),
          confirmedBy: admin.id,
          notes: parsed.data.notes ?? null,
        },
      })

      await tx.subscription.update({
        where: { businessId: business.id },
        data: {
          planId: parsed.data.planId,
          status: 'active',
          currentPeriodStart: new Date(parsed.data.periodStart),
          currentPeriodEnd: new Date(parsed.data.periodEnd),
        },
      })

      return p
    })

    res.status(201).json(payment)
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

// ── Support Tickets ───────────────────────────────────────────────────────────

function adminIsDemo(req: Express.Request): boolean {
  return Boolean((req.user as { isDemo?: boolean }).isDemo)
}

router.get('/support-tickets', async (req, res, next) => {
  try {
    res.json(
      await supportTicketService.list({
        status: req.query.status as TicketStatus | undefined,
        demoOnly: adminIsDemo(req),
      }),
    )
  } catch (err) {
    next(err)
  }
})

router.get('/support-tickets/:id', async (req, res, next) => {
  try {
    const ticket = await supportTicketService.getById(req.params.id as string, adminIsDemo(req))
    if (!ticket) return res.status(404).json({ error: 'Not found' })
    res.json(ticket)
  } catch (err) {
    next(err)
  }
})

router.post('/support-tickets/:id/messages', async (req, res, next) => {
  try {
    const parsed = z.object({ body: z.string().min(1) }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })
    const admin = req.user as { id: string }
    // Demo admins must not reply outside demo businesses — verify reachability first.
    if (adminIsDemo(req) && !(await supportTicketService.getById(req.params.id as string, true))) {
      return res.status(404).json({ error: 'Not found' })
    }
    const message = await supportTicketService.reply(req.params.id as string, admin.id, parsed.data.body)
    if (!message) return res.status(404).json({ error: 'Not found' })
    res.status(201).json(message)
  } catch (err) {
    next(err)
  }
})

router.patch('/support-tickets/:id', async (req, res, next) => {
  try {
    const parsed = z
      .object({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']) })
      .safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })
    const updated = await supportTicketService.setStatus(
      req.params.id as string,
      parsed.data.status as TicketStatus,
      adminIsDemo(req),
    )
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// ── Impersonation ────────────────────────────────────────────────────────────

router.post('/impersonate/:businessId', async (req, res, next) => {
  try {
    const admin = req.user as { id: string; isDemo?: boolean }
    if (admin.isDemo) return res.status(403).json({ error: 'Demo admin cannot impersonate' })

    const business = await prismaAdmin.business.findUnique({
      where: { id: req.params.businessId as string },
      select: { id: true },
    })
    if (!business) return res.status(404).json({ error: 'Business not found' })

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    await prismaAdmin.impersonationToken.create({
      data: { token: tokenHash, adminId: admin.id, businessId: business.id, expiresAt },
    })

    res.json({ token: rawToken, expiresAt })
  } catch (err) {
    next(err)
  }
})

// ── Demo reseed (dev only) ───────────────────────────────────────────────────

router.post('/demo/reseed', async (_req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' })
  }
  try {
    const { demoSeedQueue } = await import('../jobs/demoSeeder')
    await demoSeedQueue.add('manual-reseed', {}, { jobId: `manual-${Date.now()}` })
    res.json({ ok: true, message: 'Reseed job queued' })
  } catch (err) {
    next(err)
  }
})

export { router as adminRoutes }
