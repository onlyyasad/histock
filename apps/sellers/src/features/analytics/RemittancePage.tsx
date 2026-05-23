'use client'

import { useGetRemittancesQuery } from './store/analyticsApi'

function fmt(amount: number) {
  return `৳${Number(amount).toFixed(2)}`
}

export function RemittancePage() {
  const { data: batches, isLoading } = useGetRemittancesQuery()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">COD Remittance Tracker</h1>
      <p className="text-gray-500 text-sm mb-6">
        Track cash-on-delivery payments expected from couriers after delivery.
      </p>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="space-y-4">
        {batches?.map((batch) => (
          <div key={batch.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{batch.courier.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{batch.batchName}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {batch.totalOrders} orders · Expected: {fmt(batch.totalCodAmount)}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(batch.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full ${
                  batch.status === 'received'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {batch.status === 'received' ? 'Received' : 'Pending'}
              </span>
            </div>
          </div>
        ))}

        {!isLoading && batches?.length === 0 && (
          <p className="text-sm text-gray-400">No remittance batches yet.</p>
        )}
      </div>
    </div>
  )
}
