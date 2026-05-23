'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGetCustomersQuery } from './store/customersApi'
import { ExportButton } from '@/features/exports/ExportButton'

export function CustomersListPage() {
  const [search, setSearch] = useState('')
  const { data: customers, isLoading } = useGetCustomersQuery({ search: search || undefined })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center gap-2">
          <ExportButton endpoint="/api/v1/exports/customers" label="Export CSV" filename="customers.csv" />
          <Link
            href="/customers/new"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + New Customer
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border rounded px-3 py-2"
        />
      </div>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="space-y-2">
        {customers?.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex items-center justify-between bg-white border rounded-lg p-4 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                {c.isFlagged && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    Flagged
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{c.phone}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">৳{c.totalSpent.toFixed(2)}</p>
              <p className="text-gray-400">{c.totalOrders} orders</p>
            </div>
          </Link>
        ))}
        {customers?.length === 0 && (
          <p className="text-gray-400 text-center py-8">No customers found</p>
        )}
      </div>
    </div>
  )
}
