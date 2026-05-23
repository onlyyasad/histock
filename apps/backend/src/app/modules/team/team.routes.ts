import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireSeller, requireRole } from '../../middlewares/auth'
import { prismaAdmin, prismaWithScope } from '../../../prisma/client'

const router = Router()

// GET /api/v1/team/members — list all team members for this business
router.get('/members', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }
    const members = await prismaAdmin.user.findMany({
      where: { businessId: user.businessId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json(members)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/team/invites — list pending invites for this business
router.get('/invites', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }
    const invites = await prismaAdmin.teamInvite.findMany({
      where: { businessId: user.businessId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(invites)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/team/invites — send a team invite (owner/manager only)
router.post('/invites', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const user = req.user as { businessId: string; id: string }

    const parsed = z
      .object({
        email: z.string().email(),
        role: z.enum(['manager', 'staff']),
      })
      .safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const { email, role } = parsed.data

    const existing = await prismaAdmin.user.findFirst({
      where: { email, businessId: user.businessId, deletedAt: null },
    })
    if (existing) return res.status(409).json({ error: 'User with this email already in your team' })

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invite = await prismaAdmin.teamInvite.create({
      data: {
        businessId: user.businessId,
        email,
        role,
        invitedByUserId: user.id,
        token,
        expiresAt,
      },
      select: { id: true, email: true, role: true, token: true, expiresAt: true },
    })

    res.status(201).json(invite)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/team/invites/:token/accept — public, no auth required
router.post('/invites/:token/accept', async (req, res, next) => {
  try {
    const parsed = z
      .object({
        name: z.string().min(1).max(100),
        password: z.string().min(8),
      })
      .safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const invite = await prismaAdmin.teamInvite.findUnique({
      where: { token: req.params.token },
    })
    if (!invite) return res.status(404).json({ error: 'Invalid invite link' })
    if (invite.acceptedAt) return res.status(409).json({ error: 'Invite already used' })
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'Invite has expired' })

    const emailTaken = await prismaAdmin.user.findFirst({
      where: { email: invite.email, deletedAt: null },
    })
    if (emailTaken) return res.status(409).json({ error: 'An account with this email already exists' })

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)

    await prismaAdmin.$transaction([
      prismaAdmin.user.create({
        data: {
          businessId: invite.businessId,
          email: invite.email,
          name: parsed.data.name,
          passwordHash,
          role: invite.role,
        },
      }),
      prismaAdmin.teamInvite.update({
        where: { token: req.params.token },
        data: { acceptedAt: new Date() },
      }),
    ])

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/team/members/:userId — soft-delete a team member (owner only)
router.delete('/members/:userId', requireSeller, requireRole('owner'), async (req, res, next) => {
  try {
    const user = req.user as { businessId: string; id: string }
    const targetId = req.params.userId as string

    if (targetId === user.id) return res.status(400).json({ error: 'Cannot remove yourself' })

    const target = await prismaWithScope(user.businessId).user.findFirst({
      where: { id: targetId },
      select: { id: true, role: true },
    })
    if (!target) return res.status(404).json({ error: 'Team member not found' })

    await prismaAdmin.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date() },
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export { router as teamRoutes }
