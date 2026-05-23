'use client'

import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGetPermissionsQuery, useUpdatePermissionMutation } from './store/permissionsApi'

const PERMISSIONS: Array<{ key: string; label: string; description: string }> = [
  {
    key: 'view_cost_data',
    label: 'View Cost Data',
    description: 'See purchase costs, margins, and COGS analytics',
  },
  {
    key: 'manage_products',
    label: 'Manage Products',
    description: 'Create, edit, and archive products and variants',
  },
  {
    key: 'export_data',
    label: 'Export Data',
    description: 'Download CSV exports of orders, customers, and reports',
  },
]

const ROLES = [
  { key: 'owner', label: 'Owner', locked: true },
  { key: 'manager', label: 'Manager', locked: false },
  { key: 'staff', label: 'Staff', locked: false },
]

function ToggleCell({
  role,
  permKey,
  granted,
  locked,
}: {
  role: string
  permKey: string
  granted: boolean
  locked: boolean
}) {
  const [updatePermission, { isLoading }] = useUpdatePermissionMutation()

  const handleToggle = async () => {
    if (locked) return
    try {
      await updatePermission({
        role: role as 'manager' | 'staff',
        permission: permKey,
        granted: !granted,
      }).unwrap()
      toast.success('Permission updated')
    } catch {
      toast.error('Failed to update permission')
    }
  }

  if (locked) {
    return (
      <td className="px-4 py-3 text-center">
        <Badge variant="secondary" className="text-xs">Always</Badge>
      </td>
    )
  }

  return (
    <td className="px-4 py-3 text-center">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          granted ? 'bg-primary' : 'bg-muted-foreground/30'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-pressed={granted}
        aria-label={`${granted ? 'Revoke' : 'Grant'} permission`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            granted ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </td>
  )
}

export function PermissionsSettingsPage() {
  const { data: permissions, isLoading } = useGetPermissionsQuery()

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Role Permissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Control what each role can access. Owner permissions are always granted and cannot be changed.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">Feature Access</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-5 py-2 text-left font-medium text-muted-foreground">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r.key} className="px-4 py-2 text-center font-medium text-muted-foreground">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm, i) => (
                  <tr key={perm.key} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </td>
                    {ROLES.map((role) => (
                      <ToggleCell
                        key={role.key}
                        role={role.key}
                        permKey={perm.key}
                        granted={permissions?.[role.key]?.[perm.key] ?? false}
                        locked={role.locked}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
