'use client'

import Link from 'next/link'
import { useGetRemittanceQuery } from '../api/analyticsApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { RemittanceStatusBadge } from './RemittancePage'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtMoney } from '@/lib/utils'
import { formatDate, formatOrderNumber } from '@/lib/format'

interface Props {
  remittanceId: string
}

export function RemittanceDetailPage({ remittanceId }: Props) {
  const { data: batch, isLoading, isError } = useGetRemittanceQuery(remittanceId)

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0">
          <Skeleton className="h-48 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (isError || !batch) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <p className="text-destructive text-sm">Remittance batch not found or failed to load.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title={batch.batchName}
        description={`${batch.courier.name} · ${formatDate(batch.createdAt)}`}
        actions={<RemittanceStatusBadge status={batch.status} />}
      />

      <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0">
        {/* Side rail — summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected total</span>
                <span className="font-mono tabular-nums font-semibold">৳{fmtMoney(batch.totalCodAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span className="font-mono tabular-nums">{batch.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Courier</span>
                <span className="font-medium">{batch.courier.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Imported</span>
                <span>{formatDate(batch.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main — orders list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold">Orders in this batch</h2>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">COD amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batch.orders.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${row.order.id}`}
                        className="font-mono hover:underline text-primary"
                      >
                        {formatOrderNumber(row.order.orderNumber)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{row.order.customer.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={row.order.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      ৳{fmtMoney(row.codAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {batch.orders.map((row) => (
              <Link key={row.id} href={`/orders/${row.order.id}`} className="block">
                <div className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-primary">
                      {formatOrderNumber(row.order.orderNumber)}
                    </span>
                    <OrderStatusBadge status={row.order.status} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div>
                      <p className="text-sm font-medium">{row.order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{row.order.customer.phone}</p>
                    </div>
                    <span className="font-mono tabular-nums text-sm">৳{fmtMoney(row.codAmount)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
