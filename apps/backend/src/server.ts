import app from './app'
import config from './config'
import { scheduleDemoSeed, demoSeedWorker } from './jobs/demoSeeder'
import { emailWorker } from './jobs/emailQueue'

/* eslint-disable no-console */
async function bootstrap() {
  const port = config.port
  app.listen(port, () => {
    console.log(`histock backend listening on port ${port}`)
  })

  // Schedule nightly demo data reseed (BullMQ deduplicates on restart)
  scheduleDemoSeed().catch(console.error)

  // Keep references to prevent GC
  void demoSeedWorker
  void emailWorker
}

bootstrap().catch(console.error)
