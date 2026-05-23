'use client'

import Link from 'next/link'
import { useGetOrdersQuery } from './store/ordersApi'
import { OrderStatusBadge } from './components/OrderStatusBadge'
import { formatOrderNumber } from './NewOrderPage'

export function OrdersListPage() {
  const { data: orders, isLoading, isError } = useGetOrdersQuery({})

  if (isLoading) {
    return (
      <div className="p-6 space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="p-6 text-red-600">Could not load orders.</div>
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link
          href="/orders/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
        >
          + New Order
        </Link>
      </div>

      <div className="bg-white rounded-lg border divide-y">
        {orders?.length === 0 && (
          <p className="p-6 text-gray-400 text-center">No orders yet.</p>
        )}
        {orders?.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">{formatOrderNumber(order.orderNumber)}</p>
              <p className="text-sm text-gray-500">{order.customer.name}</p>
            </div>
            <div className="text-right space-y-1">
              <OrderStatusBadge status={order.status} />
              <p className="text-sm font-medium">৳{order.total.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
