'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGetCustomersQuery } from './store/customersApi'
import { ExportButton } from '@/features/exports/ExportButton'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function CustomersListPage() {
  const [search, setSearch] = useState('')
  const { data: customers, isLoading } = useGetCustomersQuery({ search: search || undefined })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex items-center gap-2">
          <ExportButton endpoint="/api/v1/exports/customers" label="Export CSV" filename="customers.csv" />
          <Link href="/customers/new" className={cn(buttonVariants({ size: 'sm' }))}>
            + New Customer
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      <div className="space-y-2">
        {customers?.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex items-center justify-between bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                {c.isFlagged && (
                  <Badge variant="destructive" className="text-xs">Flagged</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{c.phone}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">৳{c.totalSpent.toFixed(2)}</p>
              <p className="text-muted-foreground">{c.totalOrders} orders</p>
            </div>
          </Link>
        ))}
        {customers?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No customers found</p>
        )}
      </div>
    </div>
  )
}
