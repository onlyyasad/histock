import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.join(
    process.cwd(),
    process.env.NODE_ENV === 'production' ? '.env.prod' : '.env',
  ),
})

export default {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '4000', 10),
  database_url: process.env.DATABASE_URL!,
  cors_origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()),
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    fromAddress: process.env.RESEND_FROM_ADDRESS ?? 'noreply@histock.app',
  },
  frontend_url: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
}
