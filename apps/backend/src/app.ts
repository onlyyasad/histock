import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import config from './config'
import { sessionMiddleware } from './app/middlewares/session'
import { passport } from './app/modules/auth/passport'
import router from './app/routes'

const app = express()

app.use(helmet())
app.use(cors({ origin: config.cors_origin, credentials: true }))
app.use(express.json())
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

app.use('/api/v1', router)

export default app
