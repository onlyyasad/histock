'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useGetTeamMembersQuery,
  useGetTeamInvitesQuery,
  useSendTeamInviteMutation,
  useRemoveTeamMemberMutation,
} from './store/teamApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  const [removeMember, { isLoading: removing }] = useRemoveTeamMemberMutation()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'manager' | 'staff'>('staff')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      await sendInvite({ email: email.trim(), role }).unwrap()
      toast.success(`Invite sent to ${email.trim()}`)
      setEmail('')
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error
      toast.error(msg ?? 'Failed to send invite')
    }
  }

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from your team?`)) return
    try {
      await removeMember(userId).unwrap()
      toast.success(`${name} removed`)
    } catch {
      toast.error('Failed to remove team member')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Team</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingMembers && (
            <p className="text-sm text-muted-foreground px-6 pb-4">Loading...</p>
          )}
          {members?.map((m, i) => (
            <div key={m.id}>
              {i > 0 && <Separator />}
              <div className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                  {m.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(m.id, m.name)}
                      disabled={removing}
                      className="text-destructive hover:text-destructive text-xs h-auto py-1"
                    >
                      Remove
                    </Button>
                  )}
                </div>
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
            {loadingInvites && (
              <p className="text-sm text-muted-foreground px-6 pb-4">Loading...</p>
            )}
            {invites?.map((inv, i) => (
              <div key={inv.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(inv.expiresAt).toLocaleDateString('en-BD')}
                    </p>
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
            <div className="flex gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1"
              />
              <Select value={role} onValueChange={(v) => setRole(v as 'manager' | 'staff')}>
                <SelectTrigger className="w-36">
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
