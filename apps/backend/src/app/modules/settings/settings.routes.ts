import { Router } from 'express'
import { z } from 'zod'
import { requireSeller, requireRole } from '../../middlewares/auth'
import { prismaAdmin, prismaWithScope } from '../../../prisma/client'

const router = Router()

function getUser(req: Express.Request) {
  return req.user as { businessId: string; id: string }
}

// Permissions that can be toggled. Owner is always granted and cannot be changed.
const CONFIGURABLE_PERMISSIONS = ['view_cost_data', 'manage_products', 'export_data'] as const
type Permission = (typeof CONFIGURABLE_PERMISSIONS)[number]

// Roles that owners can configure (owner itself is locked)
const CONFIGURABLE_ROLES = ['manager', 'staff'] as const

// Default grants when no row exists: manager gets all, staff gets none
const DEFAULTS: Record<string, Record<Permission, boolean>> = {
  manager: { view_cost_data: true, manage_products: true, export_data: true },
  staff: { view_cost_data: false, manage_products: false, export_data: false },
}

// GET /api/v1/settings/permissions
router.get('/permissions', requireSeller, async (req, res, next) => {
  try {
    const { businessId } = getUser(req)

    const rows = await prismaWithScope(businessId).rolePermission.findMany({
      where: { businessId },
    })

    const result: Record<string, Record<string, boolean>> = {}

    for (const role of CONFIGURABLE_ROLES) {
      result[role] = {} as Record<Permission, boolean>
      for (const perm of CONFIGURABLE_PERMISSIONS) {
        const row = rows.find((r) => r.role === role && r.permission === perm)
        result[role][perm] = row ? row.granted : DEFAULTS[role][perm]
      }
    }

    // Owner always has everything — include for UI completeness
    result['owner'] = Object.fromEntries(CONFIGURABLE_PERMISSIONS.map((p) => [p, true]))

    res.json(result)
  } catch (err) {
    next(err)
  }
})

const UpdatePermissionsSchema = z.object({
  role: z.enum(['manager', 'staff']),
  permission: z.enum(CONFIGURABLE_PERMISSIONS),
  granted: z.boolean(),
})

// PATCH /api/v1/settings/permissions
router.patch('/permissions', requireSeller, requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    const { businessId } = getUser(req)
    const parsed = UpdatePermissionsSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const { role, permission, granted } = parsed.data

    await prismaAdmin.rolePermission.upsert({
      where: { businessId_role_permission: { businessId, role, permission } },
      create: { businessId, role, permission, granted },
      update: { granted },
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export { router as settingsRoutes }
