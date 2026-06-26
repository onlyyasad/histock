'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  useGetTeamMembersQuery,
  useGetTeamInvitesQuery,
  useSendTeamInviteMutation,
  useUpdateMemberRoleMutation,
  useRemoveTeamMemberMutation,
} from './store/teamApi'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { ListSkeleton } from '@/components/shared/TableSkeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getErrorMessage, getErrorCode } from '@/lib/apiError'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
}

export function TeamSettingsPage() {
  const { data: members, isLoading: loadingMembers } = useGetTeamMembersQuery()
  const { data: invites, isLoading: loadingInvites } = useGetTeamInvitesQuery()
  const [sendInvite, { isLoading: sending }] = useSendTeamInviteMutation()
  const [updateMemberRole] = useUpdateMemberRoleMutation()
  const [removeMember, { isLoading: removing }] = useRemoveTeamMemberMutation()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'manager' | 'staff'>('staff')
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      await sendInvite({ email: email.trim(), role }).unwrap()
      toast.success(`Invite sent to ${email.trim()}`)
      setEmail('')
    } catch (err: unknown) {
      if (getErrorCode(err) === 'USER_CAP_REACHED') {
        toast.error('Team seat limit reached. Upgrade your plan to invite more members.')
      } else {
        toast.error(getErrorMessage(err, 'Failed to send invite'))
      }
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'manager' | 'staff') => {
    try {
      await updateMemberRole({ userId, role: newRole }).unwrap()
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      await removeMember(removeTarget.id).unwrap()
      toast.success(`${removeTarget.name} removed`)
    } catch {
      toast.error('Failed to remove team member')
    } finally {
      setRemoveTarget(null)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <PageHeader title="Team" description="Manage who can access this workspace." />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingMembers && <ListSkeleton />}
          {members?.map((m, i) => (
            <div key={m.id}>
              {i > 0 && <Separator />}
              <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
                    {m.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </div>

                {m.role === 'owner' ? (
                  <Badge variant="secondary">Owner</Badge>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={m.role}
                      onValueChange={(v) => {
                        if (v) handleRoleChange(m.id, v as 'manager' | 'staff')
                      }}
                    >
                      <SelectTrigger className="h-9 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveTarget({ id: m.id, name: m.name })}
                      disabled={removing}
                      className="text-destructive hover:text-destructive text-xs h-auto py-1 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {(invites?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingInvites && <ListSkeleton />}
            {invites?.map((inv, i) => (
              <div key={inv.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm">{inv.email}</p>
                    {(() => {
                      const expiresAt = new Date(inv.expiresAt)
                      const expiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000
                      return (
                        <p className={cn('text-xs', expiringSoon ? 'text-warning' : 'text-muted-foreground')}>
                          Expires {formatDistanceToNowStrict(expiresAt, { addSuffix: true })}
                        </p>
                      )
                    })()}
                  </div>
                  <Badge variant="secondary">{ROLE_LABELS[inv.role]}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invite a team member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1"
              />
              <Select value={role} onValueChange={(v) => { if (v) setRole(v as 'manager' | 'staff') }}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={sending || !email.trim()} size="sm">
              {sending ? 'Sending...' : 'Send Invite'}
            </Button>
            <p className="text-xs text-muted-foreground">Seats are limited by your plan. You'll see a notice if you hit the cap.</p>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
        title="Remove team member"
        description={`Remove ${removeTarget?.name ?? ''} from your team? They will lose access immediately.`}
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
      />
    </div>
  )
}
