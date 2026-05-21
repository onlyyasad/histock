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
  port: process.env.PORT || 4000,
  database_url: process.env.DATABASE_URL,
  cors_origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()),
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
  admin: {
    email: process.env.ADMIN_EMAIL,
    password_hash: process.env.ADMIN_PASSWORD_HASH,
  },
}
