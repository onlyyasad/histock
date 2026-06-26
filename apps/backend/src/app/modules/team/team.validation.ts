import { z } from 'zod'
import { CONFIGURABLE_PERMISSIONS } from './team.constants'

const createInvite = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['manager', 'staff']),
  }),
})

const acceptInvite = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    password: z.string().min(8),
  }),
})

const updateRole = z.object({
  body: z.object({
    role: z.enum(['manager', 'staff']),
  }),
})

const updatePermission = z.object({
  body: z.object({
    role: z.enum(['manager', 'staff']),
    permission: z.enum(CONFIGURABLE_PERMISSIONS),
    granted: z.boolean(),
  }),
})

export const TeamValidation = {
  createInvite,
  acceptInvite,
  updateRole,
  updatePermission,
}
