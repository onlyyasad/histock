import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGetBusinessesQuery, useToggleDemoMutation } from '../../store/adminApiSlice'

function BusinessListPage() {
  const [search, setSearch] = useState('')
  const { data: businesses, isLoading } = useGetBusinessesQuery({
    search: search || undefined,
  })
  const [toggleDemo] = useToggleDemoMutation()

  const handleDemoToggle = async (id: string, current: boolean) => {
    try {
      await toggleDemo({ businessId: id, isDemo: !current }).unwrap()
      toast.success(current ? 'Demo mode disabled' : 'Demo mode enabled')
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Businesses</h1>
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-3 py-2 mb-4 w-full max-w-xs text-sm"
      />
      {isLoading && <p className="text-gray-400">Loading...</p>}
      <table className="w-full text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="pb-2">Name</th>
            <th className="pb-2">Plan</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Demo</th>
            <th className="pb-2 text-right">Orders</th>
          </tr>
        </thead>
        <tbody>
          {businesses?.map((b) => (
            <tr key={b.id} className="border-b hover:bg-gray-50">
              <td className="py-3">
                <Link
                  to="/businesses/$businessId"
                  params={{ businessId: b.id }}
                  className="font-medium hover:underline"
                >
                  {b.name}
                </Link>
                <p className="text-xs text-gray-400">{b.slug}</p>
              </td>
              <td className="py-3">
                <span className="capitalize px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                  {b.subscription.plan.name}
                </span>
              </td>
              <td className="py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    b.subscription.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : b.subscription.status === 'trial'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {b.subscription.status}
                </span>
              </td>
              <td className="py-3">
                <button
                  onClick={() => handleDemoToggle(b.id, b.isDemo)}
                  className={`px-2 py-0.5 rounded text-xs border ${
                    b.isDemo
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : 'border-gray-200 text-gray-400'
                  }`}
                >
                  {b.isDemo ? 'Demo' : 'Off'}
                </button>
              </td>
              <td className="py-3 text-right tabular-nums">{b._count.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const Route = createFileRoute('/_protected/')({
  component: BusinessListPage,
})
