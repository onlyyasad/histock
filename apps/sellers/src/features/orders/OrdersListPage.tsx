'use client'

import Link from 'next/link'
import { useGetOrdersQuery } from './store/ordersApi'
import { OrderStatusBadge } from './components/OrderStatusBadge'
import { formatOrderNumber } from './NewOrderPage'
import { ExportButton } from '@/features/exports/ExportButton'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function OrdersListPage() {
  const { data: orders, isLoading, isError } = useGetOrdersQuery({})

  if (isLoading) {
    return (
      <div className="p-6 space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="p-6 text-destructive">Could not load orders.</div>
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <ExportButton endpoint="/api/v1/exports/orders" label="Export CSV" filename="orders.csv" />
          <Link href="/orders/new" className={cn(buttonVariants({ size: 'sm' }))}>
            + New Order
          </Link>
        </div>
      </div>

      <Card className="divide-y overflow-hidden">
        {orders?.length === 0 && (
          <p className="p-6 text-muted-foreground text-center">No orders yet.</p>
        )}
        {orders?.map((order, i) => (
          <div key={order.id}>
            {i > 0 && <Separator />}
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">{formatOrderNumber(order.orderNumber)}</p>
                <p className="text-sm text-muted-foreground">{order.customer.name}</p>
              </div>
              <div className="text-right space-y-1">
                <OrderStatusBadge status={order.status} />
                <p className="text-sm font-medium">৳{order.total.toFixed(2)}</p>
              </div>
            </Link>
          </div>
        ))}
      </Card>
    </div>
  )
}
