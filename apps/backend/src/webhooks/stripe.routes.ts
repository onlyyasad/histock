import express, { Router } from 'express'
import Stripe from 'stripe'
import { prismaAdmin } from '../prisma/client'
import config from '../config'

const router = Router()

// Lazy Stripe init — avoid throwing when STRIPE_SECRET_KEY is not set in dev
let _stripe: InstanceType<typeof Stripe> | null = null
function getStripe(): InstanceType<typeof Stripe> {
  if (!_stripe) {
    _stripe = new Stripe(config.stripe.secret_key ?? '', { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

// POST /api/webhooks/stripe
// express.raw() applied here — MUST be registered before express.json() in app.ts
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'] as string

    let event: ReturnType<InstanceType<typeof Stripe>['webhooks']['constructEvent']>
    try {
      event = getStripe().webhooks.constructEvent(
        req.body as Buffer,
        sig,
        config.stripe.webhook_secret ?? '',
      )
    } catch {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const existing = await prismaAdmin.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    })
    if (existing) return res.json({ ok: true, idempotent: true })

    await prismaAdmin.webhookEvent.create({
      data: { stripeEventId: event.id, processedAt: new Date() },
    })

    switch (event.type) {
      case 'checkout.session.completed':
        // Portfolio/demo only — Stripe not available for Bangladesh merchants
        break
      default:
        break
    }

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export { router as stripeWebhookRoutes }
