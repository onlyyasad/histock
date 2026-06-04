import { Queue, Worker } from 'bullmq'
import { redis } from '../shared/redis/client'
import { prismaAdmin } from '../prisma/client'
import { emailQueue } from './emailQueue'

const QUEUE_NAME = 'subscription-lifecycle'
const GRACE_PERIOD_DAYS = 7

export const subscriptionLifecycleQueue = new Queue(QUEUE_NAME, { connection: redis })

export async function scheduleSubscriptionLifecycle() {
  await subscriptionLifecycleQueue.add(
    'daily-check',
    {},
    {
      repeat: { pattern: '0 2 * * *', tz: 'UTC' },
      jobId: 'subscription-lifecycle-daily',
    },
  )
  /* eslint-disable-next-line no-console */
  console.log('[subscription-lifecycle] Daily check scheduled for 02:00 UTC')
}

export const subscriptionLifecycleWorker = new Worker(
  QUEUE_NAME,
  async () => {
    const now = new Date()

    // ── 1. trial → grace_period when trialEndsAt has passed ────────────────
    const expiredTrials = await prismaAdmin.subscription.findMany({
      where: { status: 'trial', trialEndsAt: { lt: now } },
      include: {
        business: {
          include: {
            emailPreferences: true,
            users: {
              where: { role: 'owner', deletedAt: null },
              select: { email: true, name: true },
            },
          },
        },
      },
    })

    for (const sub of expiredTrials) {
      const gracePeriodEndsAt = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
      await prismaAdmin.subscription.update({
        where: { id: sub.id },
        data: { status: 'grace_period', gracePeriodEndsAt },
      })

      const owner = sub.business.users[0]
      const prefs = sub.business.emailPreferences
      if (owner && prefs?.trialExpiryWarnings) {
        await emailQueue
          .add('trial_expiry', {
            type: 'trial_expiry',
            daysLeft: 0,
            recipientEmail: owner.email,
            recipientName: owner.name,
          })
          .catch(() => {})
      }
    }

    // ── 2. grace_period → expired when gracePeriodEndsAt has passed ────────
    const expiredGrace = await prismaAdmin.subscription.findMany({
      where: { status: 'grace_period', gracePeriodEndsAt: { lt: now } },
    })

    for (const sub of expiredGrace) {
      await prismaAdmin.subscription.update({
        where: { id: sub.id },
        data: { status: 'expired' },
      })
    }

    // ── 3. Upcoming trial expiry warnings (7-day and 1-day) ────────────────
    const DAY_MS = 24 * 60 * 60 * 1000
    const warningWindows = [
      {
        daysLeft: 7,
        windowStart: new Date(now.getTime() + 7 * DAY_MS),
        windowEnd: new Date(now.getTime() + 8 * DAY_MS),
      },
      {
        daysLeft: 1,
        windowStart: new Date(now.getTime() + DAY_MS),
        windowEnd: new Date(now.getTime() + 2 * DAY_MS),
      },
    ]

    for (const { daysLeft, windowStart, windowEnd } of warningWindows) {
      const upcoming = await prismaAdmin.subscription.findMany({
        where: { status: 'trial', trialEndsAt: { gte: windowStart, lt: windowEnd } },
        include: {
          business: {
            include: {
              emailPreferences: true,
              users: {
                where: { role: 'owner', deletedAt: null },
                select: { email: true, name: true },
              },
            },
          },
        },
      })

      for (const sub of upcoming) {
        const prefs = sub.business.emailPreferences
        if (!prefs?.trialExpiryWarnings) continue
        const owner = sub.business.users[0]
        if (!owner) continue
        await emailQueue
          .add('trial_expiry', {
            type: 'trial_expiry',
            daysLeft,
            recipientEmail: owner.email,
            recipientName: owner.name,
          })
          .catch(() => {})
      }
    }

    /* eslint-disable-next-line no-console */
    console.log(
      `[subscription-lifecycle] Done. trial→grace: ${expiredTrials.length}, grace→expired: ${expiredGrace.length}`,
    )
  },
  { connection: redis, concurrency: 1 },
)

subscriptionLifecycleWorker.on('failed', (job, err) => {
  /* eslint-disable-next-line no-console */
  console.error(`[subscription-lifecycle] Job ${job?.id} failed:`, err.message)
})
