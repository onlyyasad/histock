import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { Decimal } from '@prisma/client/runtime/library'
import config from './config'
import { sessionMiddleware } from './app/middlewares/session'
import { passport } from './app/modules/auth/passport'
import router from './app/routes'
import { adminRoutes } from './admin/admin.routes'
import { stripeWebhookRoutes } from './webhooks/stripe.routes'

const app = express()

// Convert Prisma Decimal objects to JS numbers in all JSON responses.
// Decimal fields are stored as NUMERIC(12,2) — serialize as number, not string.
app.set('json replacer', (_key: string, value: unknown) =>
  value instanceof Decimal ? value.toNumber() : value,
)

app.use(helmet())
app.use(cors({ origin: config.cors_origin, credentials: true }))

// Stripe webhook must receive raw body — mount BEFORE express.json()
app.use('/api/webhooks', stripeWebhookRoutes)

app.use(express.json())
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

app.use('/api/v1', router)
app.use('/api/v1/admin', adminRoutes)

export default app
