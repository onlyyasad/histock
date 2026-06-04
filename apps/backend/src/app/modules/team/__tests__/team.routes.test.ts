import request from 'supertest'
import app from '../../../../app'
import { prismaAdmin } from '../../../../prisma/client'
import { redis } from '../../../../shared/redis/client'

// Hits the real test database — no mocks.

const OWNER_EMAIL = `team-owner-${Date.now()}@test.com`
const OWNER_PASSWORD = 'password123'

let ownerAgent: ReturnType<typeof request.agent>
let businessId: string
let ownerId: string

beforeAll(async () => {
  const res = await request(app).post('/api/v1/auth/register').send({
    businessName: 'Team Test Shop',
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    name: 'Team Owner',
  })
  expect(res.status).toBe(201)
  businessId = res.body.businessId
  ownerId = res.body.id

  ownerAgent = request.agent(app)
  await ownerAgent
    .post('/api/v1/auth/login')
    .send({ email: OWNER_EMAIL, password: OWNER_PASSWORD })
})

afterAll(async () => {
  await prismaAdmin.teamInvite.deleteMany({ where: { businessId } })
  await prismaAdmin.rolePermission.deleteMany({ where: { businessId } })
  await prismaAdmin.subscription.deleteMany({ where: { businessId } })
  await prismaAdmin.emailPreference.deleteMany({ where: { businessId } })
  await prismaAdmin.user.deleteMany({ where: { businessId } })
  await prismaAdmin.business.delete({ where: { id: businessId } })
  await prismaAdmin.$disconnect()
  await redis.quit()
})

describe('POST /api/v1/team/invites', () => {
  it('creates invite for valid email + role', async () => {
    const res = await ownerAgent
      .post('/api/v1/team/invites')
      .send({ email: `new-member-${Date.now()}@test.com`, role: 'staff' })

    expect(res.status).toBe(201)
    expect(res.body.role).toBe('staff')
    expect(res.body.token).toBeDefined()
  })

  it('returns 409 if email is already on the team', async () => {
    const res = await ownerAgent
      .post('/api/v1/team/invites')
      .send({ email: OWNER_EMAIL, role: 'staff' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already in your team/i)
  })

  it('returns 400 for invalid role (owner not allowed)', async () => {
    const res = await ownerAgent
      .post('/api/v1/team/invites')
      .send({ email: 'x@test.com', role: 'owner' })

    expect(res.status).toBe(400)
  })

  it('returns 402 when seat limit reached (starter: maxUsers = 1)', async () => {
    // Registration creates businesses on growth trial (maxUsers = 3).
    // Downgrade to starter (maxUsers = 1) so the 1 existing owner fills the cap.
    await prismaAdmin.subscription.update({
      where: { businessId },
      data: { planId: 'starter' },
    })

    const res = await ownerAgent
      .post('/api/v1/team/invites')
      .send({ email: `cap-test-${Date.now()}@test.com`, role: 'staff' })

    // Restore to growth before asserting so subsequent tests have the right plan.
    await prismaAdmin.subscription.update({
      where: { businessId },
      data: { planId: 'growth' },
    })

    expect(res.status).toBe(402)
    expect(res.body.code).toBe('USER_CAP_REACHED')
  })
})

describe('POST /api/v1/team/invites/:token/accept', () => {
  let inviteToken: string
  let inviteEmail: string

  beforeAll(async () => {
    // Temporarily bump the plan to allow the invite
    await prismaAdmin.subscription.update({
      where: { businessId },
      data: { planId: 'growth' },
    })

    inviteEmail = `accept-${Date.now()}@test.com`
    const res = await ownerAgent
      .post('/api/v1/team/invites')
      .send({ email: inviteEmail, role: 'manager' })
    expect(res.status).toBe(201)
    inviteToken = res.body.token

    // Restore starter plan
    await prismaAdmin.subscription.update({
      where: { businessId },
      data: { planId: 'starter' },
    })
  })

  it('creates user and marks invite accepted', async () => {
    const res = await request(app)
      .post(`/api/v1/team/invites/${inviteToken}/accept`)
      .send({ name: 'New Manager', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const user = await prismaAdmin.user.findFirst({
      where: { email: inviteEmail, businessId },
    })
    expect(user).not.toBeNull()
    expect(user?.role).toBe('manager')

    const invite = await prismaAdmin.teamInvite.findFirst({ where: { token: inviteToken } })
    expect(invite?.acceptedAt).not.toBeNull()
  })

  it('returns 409 on second accept of same token', async () => {
    const res = await request(app)
      .post(`/api/v1/team/invites/${inviteToken}/accept`)
      .send({ name: 'Again', password: 'password123' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already used/i)
  })
})

describe('PATCH /api/v1/team/members/:userId/role', () => {
  let memberId: string

  beforeAll(async () => {
    // Get the manager created in the previous describe block
    const member = await prismaAdmin.user.findFirst({
      where: { businessId, role: 'manager', deletedAt: null },
    })
    if (!member) throw new Error('Expected manager to exist from accept test')
    memberId = member.id
  })

  it('owner can demote manager to staff', async () => {
    const res = await ownerAgent
      .patch(`/api/v1/team/members/${memberId}/role`)
      .send({ role: 'staff' })

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('staff')
  })

  it('owner can promote staff back to manager', async () => {
    const res = await ownerAgent
      .patch(`/api/v1/team/members/${memberId}/role`)
      .send({ role: 'manager' })

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('manager')
  })

  it('returns 400 when owner tries to change own role', async () => {
    const res = await ownerAgent
      .patch(`/api/v1/team/members/${ownerId}/role`)
      .send({ role: 'staff' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/own role/i)
  })

  it('returns 400 for invalid role value', async () => {
    const res = await ownerAgent
      .patch(`/api/v1/team/members/${memberId}/role`)
      .send({ role: 'platform_admin' })

    expect(res.status).toBe(400)
  })
})
