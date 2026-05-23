import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGetBusinessQuery, useUpdateSubscriptionMutation } from '../../store/adminApiSlice'

const STATUSES = ['trial', 'active', 'grace_period', 'expired', 'cancelled'] as const

function BusinessDetailPage({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useGetBusinessQuery(businessId)
  const [updateSub, { isLoading: saving }] = useUpdateSubscriptionMutation()
  const [planId, setPlanId] = useState('')
  const [status, setStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!business) return <div className="p-6 text-red-500">Business not found</div>

  const handleSave = async () => {
    try {
      await updateSub({
        businessId,
        ...(planId ? { planId } : {}),
        ...(status ? { status } : {}),
        ...(adminNotes ? { adminNotes } : {}),
      }).unwrap()
      toast.success('Subscription updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <p className="text-gray-400 text-sm">{business.slug}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-2xl font-bold">{business._count.users}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-2xl font-bold">{business._count.orders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="text-2xl font-bold">{business.subscription.plan.name}</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold">Subscription</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Current Plan</label>
            <p className="text-sm font-medium">
              {business.subscription.plan.name}{' '}
              <span className="text-gray-400">({business.subscription.planId})</span>
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Status</label>
            <p className="text-sm">
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  business.subscription.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {business.subscription.status}
              </span>
            </p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-medium">Override</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Plan ID</label>
              <input
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                placeholder={business.subscription.planId}
                className="w-full border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded px-3 py-1.5 text-sm"
              >
                <option value="">— keep current —</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Admin Notes</label>
            <input
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Optional internal note"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (!planId && !status && !adminNotes)}
            className="bg-black text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-4">Team</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {business.users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.name}</td>
                <td className="py-2 text-gray-400">{u.email}</td>
                <td className="py-2 capitalize">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/businesses/$businessId')({
  component: () => {
    const { businessId } = Route.useParams()
    return <BusinessDetailPage businessId={businessId} />
  },
})
