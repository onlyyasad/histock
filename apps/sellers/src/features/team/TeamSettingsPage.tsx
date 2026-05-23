'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useGetTeamMembersQuery,
  useGetTeamInvitesQuery,
  useSendTeamInviteMutation,
  useRemoveTeamMemberMutation,
} from './store/teamApi'

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
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Team</h1>

      <section className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-4">Members</h2>
        {loadingMembers && <p className="text-sm text-gray-400">Loading...</p>}
        <div className="divide-y">
          {members?.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{m.name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{ROLE_LABELS[m.role]}</span>
                {m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(m.id, m.name)}
                    disabled={removing}
                    className="text-xs text-red-500 hover:underline disabled:opacity-40"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {(invites?.length ?? 0) > 0 && (
        <section className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Pending Invites</h2>
          {loadingInvites && <p className="text-sm text-gray-400">Loading...</p>}
          <div className="divide-y">
            {invites?.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Expires {new Date(inv.expiresAt).toLocaleDateString('en-BD')}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{ROLE_LABELS[inv.role]}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-4">Invite a team member</h2>
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 border rounded px-3 py-2 text-sm"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'manager' | 'staff')}
              className="border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
          >
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </section>
    </div>
  )
}
