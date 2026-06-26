import { Prisma } from '@prisma/client'

// Permissions an owner can toggle for manager/staff. Owner is always fully granted.
export const CONFIGURABLE_PERMISSIONS = ['view_cost_data', 'manage_products', 'export_data'] as const
export type ConfigurablePermission = (typeof CONFIGURABLE_PERMISSIONS)[number]

// Roles an owner can configure (owner itself is locked).
export const CONFIGURABLE_ROLES = ['manager', 'staff'] as const
export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number]

// Default grants when no RolePermission row exists: manager gets all, staff none.
export const PERMISSION_DEFAULTS: Record<ConfigurableRole, Record<ConfigurablePermission, boolean>> = {
  manager: { view_cost_data: true, manage_products: true, export_data: true },
  staff: { view_cost_data: false, manage_products: false, export_data: false },
}

// Invites expire 7 days after creation.
export const INVITE_EXPIRY_DAYS = 7

export const teamMemberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export const teamInviteSelect = {
  id: true,
  email: true,
  role: true,
  expiresAt: true,
  createdAt: true,
} satisfies Prisma.TeamInviteSelect
