import app from './app'
import config from './config'

/* eslint-disable no-console */
async function bootstrap() {
  const port = config.port
  app.listen(port, () => {
    console.log(`histock backend listening on port ${port}`)
  })
}

bootstrap().catch(console.error)
