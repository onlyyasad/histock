import { Queue, Worker } from 'bullmq'
import { redis } from '../shared/redis/client'
import { reseedDemoData } from './demoSeedCore'

export const DEMO_SEED_QUEUE = 'demo-seed'
export const demoSeedQueue = new Queue(DEMO_SEED_QUEUE, { connection: redis })

export async function scheduleDemoSeed() {
  await demoSeedQueue.add(
    'nightly-reseed',
    {},
    {
      repeat: { pattern: '0 18 * * *', tz: 'UTC' },
      jobId: 'demo-reseed-nightly',
    },
  )
  console.log('[demo-seed] Nightly reseed scheduled for 18:00 UTC')
}

export const demoSeedWorker = new Worker(
  DEMO_SEED_QUEUE,
  async (job) => {
    console.log(`[demo-seed] Starting reseed job ${job.id}`)
    const businessId = await reseedDemoData()
    const yearMonth = new Date().toISOString().slice(0, 7)
    await redis.del(`orders:count:${businessId}:${yearMonth}`)
    console.log(`[demo-seed] Reseed complete`)
  },
  { connection: redis, concurrency: 1 },
)

demoSeedWorker.on('failed', (job, err) => {
  console.error(`[demo-seed] Job ${job?.id} failed:`, err)
})
