import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import { sendPasswordResetEmail } from '../../../shared/email/client'
import config from '../../../config'
import ApiError from '../../../errors/ApiError'
import { RESET_TOKEN_TTL_MS, TRIAL_DAYS, TRIAL_PLAN_ID, BCRYPT_ROUNDS } from './auth.constants'
import type { IRegisterInput } from './auth.interface'

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex')

// --- register --------------------------------------------------------------

const generateBusinessSlug = (businessName: string) =>
  businessName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + `-${Date.now()}`

const assertEmailAvailable = async (email: string) => {
  const existing = await prismaAdmin.user.findFirst({ where: { email } })
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already in use')
  }
}

const registerBusiness = async (input: IRegisterInput) => {
  const email = input.email.toLowerCase()
  await assertEmailAvailable(email)

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const slug = generateBusinessSlug(input.businessName)
  const now = new Date()
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

  const business = await prismaAdmin.business.create({
    data: {
      name: input.businessName,
      slug,
      subscription: {
        create: {
          planId: TRIAL_PLAN_ID,
          status: 'trial',
          billingAnchorDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialEndsAt: trialEnd,
        },
      },
      emailPreferences: { create: {} },
      users: {
        create: { email, passwordHash, name: input.name, role: 'owner' },
      },
    },
    include: { users: true },
  })

  return { user: business.users[0], business }
}

// --- password reset --------------------------------------------------------

const requestPasswordReset = async (rawEmail: string): Promise<void> => {
  const email = rawEmail.toLowerCase()
  const user = await prismaAdmin.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true },
  })
  if (!user) return // no leak

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = sha256(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

  await prismaAdmin.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  await prismaAdmin.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } })

  const resetUrl = `${config.frontend_url}/reset-password?token=${rawToken}`
  await sendPasswordResetEmail(user.email, resetUrl)
}

const resetPassword = async (token: string, password: string): Promise<void> => {
  const tokenHash = sha256(token)
  const record = await prismaAdmin.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  })
  if (!record) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired reset link')
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  await prismaAdmin.$transaction([
    prismaAdmin.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prismaAdmin.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
  ])
}

// --- impersonation (token consume; session set in controller) --------------

const consumeImpersonationToken = async (token: string) => {
  const tokenHash = sha256(token)
  const record = await prismaAdmin.impersonationToken.findFirst({
    where: { token: tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    include: { business: { select: { id: true, name: true, isDemo: true } } },
  })
  if (!record) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired impersonation token')
  }

  await prismaAdmin.impersonationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })

  const owner = await prismaAdmin.user.findFirst({
    where: { businessId: record.businessId, role: 'owner', deletedAt: null },
    include: { business: { select: { id: true, name: true, isDemo: true } } },
  })
  if (!owner) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No owner found for this business')
  }

  return { owner, record }
}

export const AuthService = {
  registerBusiness,
  requestPasswordReset,
  resetPassword,
  consumeImpersonationToken,
}
