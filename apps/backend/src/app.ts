import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import config from './config'
import router from './app/routes'

const app = express()

app.use(helmet())
app.use(cors({ origin: config.cors_origin, credentials: true }))
app.use(express.json())

app.use('/api/v1', router)

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

export default app
