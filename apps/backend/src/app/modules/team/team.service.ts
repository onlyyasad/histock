import bcrypt from 'bcryptjs'
import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import type { ScopedPrisma } from '../../../prisma/types'
import ApiError from '../../../errors/ApiError'
import {
  CONFIGURABLE_PERMISSIONS,
  CONFIGURABLE_ROLES,
  PERMISSION_DEFAULTS,
  INVITE_EXPIRY_DAYS,
  teamMemberSelect,
  teamInviteSelect,
  type ConfigurableRole,
} from './team.constants'
import type {
  ICreateInviteInput,
  IAcceptInviteInput,
  IUpdatePermissionInput,
} from './team.interface'

// --- members & invites (reads) ---------------------------------------------

const listMembers = (db: ScopedPrisma) =>
  db.user.findMany({ select: teamMemberSelect, orderBy: { createdAt: 'asc' } })

const listInvites = (db: ScopedPrisma) =>
  db.teamInvite.findMany({
    where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    select: teamInviteSelect,
    orderBy: { createdAt: 'desc' },
  })

// --- create invite (cap-checked) -------------------------------------------

const assertEmailNotOnTeam = async (db: ScopedPrisma, email: string) => {
  const existing = await db.user.findFirst({ where: { email } })
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, 'User with this email already in your team')
  }
}

const assertSeatAvailable = async (businessId: string) => {
  const sub = await prismaAdmin.subscription.findUnique({
    where: { businessId },
    include: { plan: { select: { maxUsers: true } } },
  })
  const userCap = sub?.plan.maxUsers ?? null
  if (userCap === null) return

  const activeCount = await prismaAdmin.user.count({ where: { businessId, deletedAt: null } })
  if (activeCount >= userCap) {
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      `Team member limit reached (${userCap}). Upgrade your plan to invite more members.`,
      { code: 'USER_CAP_REACHED' },
    )
  }
}

const createInvite = async (
  db: ScopedPrisma,
  businessId: string,
  invitedByUserId: string,
  input: ICreateInviteInput,
) => {
  await assertEmailNotOnTeam(db, input.email)
  await assertSeatAvailable(businessId)

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  return prismaAdmin.teamInvite.create({
    data: { businessId, email: input.email, role: input.role, invitedByUserId, token, expiresAt },
    select: { id: true, email: true, role: true, token: true, expiresAt: true },
  })
}

// --- accept invite (public) ------------------------------------------------

const loadUsableInvite = async (token: string) => {
  const invite = await prismaAdmin.teamInvite.findUnique({ where: { token } })
  if (!invite) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid invite link')
  }
  if (invite.acceptedAt) {
    throw new ApiError(httpStatus.CONFLICT, 'Invite already used')
  }
  if (invite.expiresAt < new Date()) {
    throw new ApiError(httpStatus.GONE, 'Invite has expired')
  }
  return invite
}

const acceptInvite = async (token: string, input: IAcceptInviteInput) => {
  const invite = await loadUsableInvite(token)

  const emailTaken = await prismaAdmin.user.findFirst({
    where: { email: invite.email, deletedAt: null },
  })
  if (emailTaken) {
    throw new ApiError(httpStatus.CONFLICT, 'An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(input.password, 12)

  await prismaAdmin.$transaction([
    prismaAdmin.user.create({
      data: {
        businessId: invite.businessId,
        email: invite.email,
        name: input.name,
        passwordHash,
        role: invite.role,
      },
    }),
    prismaAdmin.teamInvite.update({ where: { token }, data: { acceptedAt: new Date() } }),
  ])
}

// --- member management -----------------------------------------------------

const removeMember = async (db: ScopedPrisma, requestingUserId: string, targetId: string) => {
  if (targetId === requestingUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot remove yourself')
  }
  const target = await db.user.findFirst({ where: { id: targetId }, select: { id: true, role: true } })
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Team member not found')
  }
  await prismaAdmin.user.update({ where: { id: targetId }, data: { deletedAt: new Date() } })
}

const updateMemberRole = async (
  db: ScopedPrisma,
  requestingUserId: string,
  targetId: string,
  role: ConfigurableRole,
) => {
  if (targetId === requestingUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change your own role')
  }
  const target = await db.user.findFirst({ where: { id: targetId }, select: { id: true, role: true } })
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Team member not found')
  }
  if (target.role === 'owner') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the role of an owner')
  }
  return prismaAdmin.user.update({
    where: { id: targetId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })
}

// --- role permissions (matrix) ---------------------------------------------

const getPermissions = async (db: ScopedPrisma) => {
  const rows = await db.rolePermission.findMany()

  const result: Record<string, Record<string, boolean>> = {}
  for (const role of CONFIGURABLE_ROLES) {
    result[role] = {}
    for (const perm of CONFIGURABLE_PERMISSIONS) {
      const row = rows.find((r) => r.role === role && r.permission === perm)
      result[role][perm] = row ? row.granted : PERMISSION_DEFAULTS[role][perm]
    }
  }
  // Owner always has everything — included for UI completeness.
  result.owner = Object.fromEntries(CONFIGURABLE_PERMISSIONS.map((p) => [p, true]))
  return result
}

const updatePermission = async (businessId: string, input: IUpdatePermissionInput) => {
  const { role, permission, granted } = input
  await prismaAdmin.rolePermission.upsert({
    where: { businessId_role_permission: { businessId, role, permission } },
    create: { businessId, role, permission, granted },
    update: { granted },
  })
}

export const TeamService = {
  listMembers,
  listInvites,
  createInvite,
  acceptInvite,
  removeMember,
  updateMemberRole,
  getPermissions,
  updatePermission,
}
