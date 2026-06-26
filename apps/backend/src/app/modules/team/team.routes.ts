import { Router } from 'express'
import { UserRole } from '@prisma/client'
import { requireSeller, requireRole } from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { TeamController } from './team.controller'
import { TeamValidation } from './team.validation'

const seller = Router()

seller.get('/members', requireSeller, TeamController.listMembers)
seller.get(
  '/invites',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  TeamController.listInvites,
)
seller.post(
  '/invites',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  validateRequest(TeamValidation.createInvite),
  TeamController.createInvite,
)
// Public — invitee has no session yet.
seller.post(
  '/invites/:token/accept',
  validateRequest(TeamValidation.acceptInvite),
  TeamController.acceptInvite,
)
seller.delete(
  '/members/:userId',
  requireSeller,
  requireRole(UserRole.owner),
  TeamController.removeMember,
)
seller.patch(
  '/members/:userId/role',
  requireSeller,
  requireRole(UserRole.owner),
  validateRequest(TeamValidation.updateRole),
  TeamController.updateRole,
)

// Role permissions (absorbed from the dissolved settings module).
seller.get('/permissions', requireSeller, TeamController.getPermissions)
seller.patch(
  '/permissions',
  requireSeller,
  requireRole(UserRole.owner, UserRole.manager),
  validateRequest(TeamValidation.updatePermission),
  TeamController.updatePermission,
)

// Admin team surface is added in the admin refactor.
const admin = Router()

export const teamRoutes = { seller, admin }
