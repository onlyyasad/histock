import request from 'supertest'
import app from '../../../../app'
import { prismaAdmin } from '../../../../prisma/client'
import { redis } from '../../../../shared/redis/client'

// These tests hit the real database (port 5433 via .env).
// A real DB is required — we do NOT mock Prisma.

const TEST_EMAIL = `auth-test-${Date.now()}@example.com`
const TEST_PASSWORD = 'testpassword123'
const BUSINESS_NAME = 'Auth Test Shop'

beforeAll(async () => {
  // Clear rate limit keys so tests are not affected by prior runs
  const keys = await redis.keys('login_attempts:*')
  const fpKeys = await redis.keys('forgot_pw_attempts:*')
  const allKeys = [...keys, ...fpKeys]
  if (allKeys.length > 0) await redis.del(...allKeys)
})

afterAll(async () => {
  // Clean up test data
  await prismaAdmin.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prismaAdmin.$disconnect()
  await redis.quit()
})

describe('POST /api/v1/auth/register', () => {
  it('creates user + business + session on valid payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ businessName: BUSINESS_NAME, email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Test User' })

    expect(res.status).toBe(201)
    expect(res.body.data.email).toBe(TEST_EMAIL)
    expect(res.body.data.businessId).toBeDefined()
    expect(res.headers['set-cookie']).toBeDefined()

    const dbUser = await prismaAdmin.user.findFirst({ where: { email: TEST_EMAIL } })
    expect(dbUser).not.toBeNull()
    expect(dbUser?.passwordHash).not.toBe(TEST_PASSWORD) // must be hashed
  })

  it('returns 409 on duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ businessName: 'Another Shop', email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Dup' })

    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/email already in use/i)
  })

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'nope@example.com' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/v1/auth/login', () => {
  let agent: ReturnType<typeof request.agent>

  beforeEach(() => {
    agent = request.agent(app)
  })

  it('returns 200 + session cookie on valid credentials', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(TEST_EMAIL)
    expect(res.body.data.businessId).toBeDefined()
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('returns 401 on wrong password', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it('returns 401 on unknown email', async () => {
    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nowhere.com', password: TEST_PASSWORD })

    expect(res.status).toBe(401)
  })

  it('returns 401 for soft-deleted user', async () => {
    await prismaAdmin.user.updateMany({
      where: { email: TEST_EMAIL },
      data: { deletedAt: new Date() },
    })

    const res = await agent
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    expect(res.status).toBe(401)

    await prismaAdmin.user.updateMany({
      where: { email: TEST_EMAIL },
      data: { deletedAt: null },
    })
  })
})

describe('GET /api/v1/auth/me', () => {
  let agent: ReturnType<typeof request.agent>

  beforeEach(async () => {
    agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })

  it('returns user info when authenticated', async () => {
    const res = await agent.get('/api/v1/auth/me')

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(TEST_EMAIL)
    expect(res.body.data.businessId).toBeDefined()
  })

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/auth/logout', () => {
  it('destroys session — subsequent /me returns 401', async () => {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({ email: TEST_EMAIL, password: TEST_PASSWORD })

    const logoutRes = await agent.post('/api/v1/auth/logout')
    expect(logoutRes.status).toBe(200)

    const meRes = await agent.get('/api/v1/auth/me')
    expect(meRes.status).toBe(401)
  })
})

describe('POST /api/v1/auth/forgot-password', () => {
  it('returns 200 for known email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: TEST_EMAIL })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('returns 200 for unknown email (no leak)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@nowhere.com' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('stores hashed token (not raw) in DB', async () => {
    // Clear existing tokens
    const user = await prismaAdmin.user.findFirst({ where: { email: TEST_EMAIL } })
    if (user) {
      await prismaAdmin.passwordResetToken.deleteMany({ where: { userId: user.id } })
    }

    await request(app).post('/api/v1/auth/forgot-password').send({ email: TEST_EMAIL })

    const tokens = await prismaAdmin.passwordResetToken.findMany({
      where: { user: { email: TEST_EMAIL } },
    })
    expect(tokens.length).toBe(1)
    // Token hash is a 64-char hex SHA-256 — never the raw token
    expect(tokens[0].tokenHash).toHaveLength(64)
    expect(tokens[0].tokenHash).toMatch(/^[a-f0-9]+$/)
  })

  it('invalidates previous unused tokens on re-request', async () => {
    // First request
    await request(app).post('/api/v1/auth/forgot-password').send({ email: TEST_EMAIL })
    // Second request
    await request(app).post('/api/v1/auth/forgot-password').send({ email: TEST_EMAIL })

    const user = await prismaAdmin.user.findFirst({ where: { email: TEST_EMAIL } })
    const activeTokens = await prismaAdmin.passwordResetToken.findMany({
      where: { userId: user!.id, usedAt: null },
    })
    expect(activeTokens.length).toBe(1) // only the latest is active
  })
})

describe('POST /api/v1/auth/reset-password', () => {
  it('returns 400 on invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'invalidtoken', password: 'newpassword123' })

    expect(res.status).toBe(400)
  })

  it('returns 400 on password too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'sometoken', password: 'short' })

    expect(res.status).toBe(400)
  })

  it('resets password with valid token', async () => {
    const crypto = await import('node:crypto')
    const user = await prismaAdmin.user.findFirst({ where: { email: TEST_EMAIL } })

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    await prismaAdmin.passwordResetToken.create({
      data: {
        userId: user!.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, password: 'brandnewpassword123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // Token is marked used
    const record = await prismaAdmin.passwordResetToken.findFirst({ where: { tokenHash } })
    expect(record?.usedAt).not.toBeNull()

    // Old password no longer works
    const agent = request.agent(app)
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
    expect(loginRes.status).toBe(401)

    // New password works — reset back for other tests
    await agent.post('/api/v1/auth/login').send({ email: TEST_EMAIL, password: 'brandnewpassword123' })
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, password: TEST_PASSWORD }) // already used, will 400

    // Directly reset password for subsequent tests
    const bcrypt = await import('bcryptjs')
    await prismaAdmin.user.update({
      where: { id: user!.id },
      data: { passwordHash: await bcrypt.hash(TEST_PASSWORD, 12) },
    })
  })
})

describe('requireSeller middleware', () => {
  it('blocks platform_admin session with 403', async () => {
    // Create a temp admin for this test
    const adminEmail = `admin-test-${Date.now()}@histock.app`
    await prismaAdmin.user.create({
      data: {
        email: adminEmail,
        passwordHash: await import('bcryptjs').then((b) => b.hash('adminpass123', 12)),
        name: 'Test Admin',
        role: 'platform_admin',
        businessId: null,
      },
    })

    const agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({ email: adminEmail, password: 'adminpass123' })

    const res = await agent.get('/api/v1/auth/me')
    expect(res.status).toBe(403)

    await prismaAdmin.user.deleteMany({ where: { email: adminEmail } })
  })
})
