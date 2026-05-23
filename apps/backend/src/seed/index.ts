import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Couriers (Bangladesh defaults — pre-seeded, not configurable) ──────────
  const couriers = [
    { name: 'Pathao', isSystem: false },
    { name: 'REDX', isSystem: false },
    { name: 'eCourier', isSystem: false },
    { name: 'Sundarban', isSystem: false },
    { name: 'SA Paribahan', isSystem: false },
    { name: 'Self Delivery', isSystem: true },
  ]

  for (const courier of couriers) {
    await prisma.courier.upsert({
      where: { name: courier.name },
      update: {},
      create: courier,
    })
  }

  console.log('Seed: 6 couriers created')

  // ── Subscription plans ─────────────────────────────────────────────────────
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: 1,
      maxOrdersPerMonth: 200,
      maxProducts: 5,
      maxSkus: 25,
      aiGenerationsPerDay: 0,
      features: {
        emailSupport: false,
        dataExport: false,
        customInvoiceBranding: false,
        advancedAnalytics: false,
        teamAccess: false,
        aiFeatures: false,
      },
      displayOrder: 0,
    },
    {
      id: 'growth',
      name: 'Growth',
      priceMonthly: 500,
      priceYearly: 4800,
      maxUsers: 3,
      maxOrdersPerMonth: 500,
      maxProducts: 20,
      maxSkus: 100,
      aiGenerationsPerDay: 10,
      features: {
        emailSupport: true,
        dataExport: true,
        customInvoiceBranding: false,
        advancedAnalytics: false,
        teamAccess: true,
        aiFeatures: false,
      },
      displayOrder: 1,
    },
    {
      id: 'business',
      name: 'Business',
      priceMonthly: 1200,
      priceYearly: 11500,
      maxUsers: 10,
      maxOrdersPerMonth: 1500,
      maxProducts: 50,
      maxSkus: 250,
      aiGenerationsPerDay: 50,
      features: {
        emailSupport: true,
        dataExport: true,
        customInvoiceBranding: true,
        advancedAnalytics: true,
        teamAccess: true,
        aiFeatures: true,
      },
      displayOrder: 2,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: null,
      maxOrdersPerMonth: null,
      maxProducts: null,
      maxSkus: null,
      aiGenerationsPerDay: 100,
      features: {
        emailSupport: true,
        dataExport: true,
        customInvoiceBranding: true,
        advancedAnalytics: true,
        teamAccess: true,
        aiFeatures: true,
      },
      displayOrder: 3,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    })
  }

  console.log('Seed: 4 subscription plans created')

  // ── connect-pg-simple sessions table ──────────────────────────────────────
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `)

  console.log('Seed: sessions table ready')

  // ── Platform admin account ─────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@histock.app'
  const adminPassword = process.env.ADMIN_SEED_PASSWORD
  if (!adminPassword) {
    console.warn('ADMIN_SEED_PASSWORD not set — skipping platform_admin seed')
  } else {
    const bcrypt = await import('bcryptjs')
    const adminHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash: adminHash,
        name: 'Platform Admin',
        role: 'platform_admin',
        businessId: null,
      },
    })
    console.log(`Seed: platform_admin created (${adminEmail})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
