'use client'

import { toast } from 'sonner'
import { useGetOrderQuery, useConfirmCodPaymentMutation } from './store/ordersApi'
import { OrderStatusBadge } from './components/OrderStatusBadge'
import { StatusUpdateButton } from './components/StatusUpdateButton'
import { formatOrderNumber } from './NewOrderPage'

const NEXT_STATUSES: Record<string, Array<{ toStatus: string; label: string; variant: 'primary' | 'danger' | 'secondary' }>> = {
  pending: [
    { toStatus: 'processing', label: 'Start Processing', variant: 'primary' },
    { toStatus: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  processing: [
    { toStatus: 'packed', label: 'Mark Packed', variant: 'primary' },
    { toStatus: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  packed: [
    { toStatus: 'handover_to_courier', label: 'Hand to Courier', variant: 'primary' },
    { toStatus: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  handover_to_courier: [
    { toStatus: 'delivered', label: 'Mark Delivered', variant: 'primary' },
    { toStatus: 'delivery_failed', label: 'Delivery Failed', variant: 'danger' },
    { toStatus: 'cancelled', label: 'Cancel', variant: 'secondary' },
  ],
  delivery_failed: [
    { toStatus: 'handover_to_courier', label: 'Re-attempt Delivery', variant: 'primary' },
    { toStatus: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  delivered: [
    { toStatus: 'refunded', label: 'Refund', variant: 'danger' },
  ],
  cancelled: [
    { toStatus: 'refunded', label: 'Refund', variant: 'danger' },
  ],
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { data: order, isLoading, isError } = useGetOrderQuery(orderId)
  const [confirmCodPayment, { isLoading: confirmingCod }] = useConfirmCodPaymentMutation()

  if (isLoading) return <div className="p-6">Loading...</div>
  if (isError || !order) return <div className="p-6 text-red-600">Order not found.</div>

  const nextActions = NEXT_STATUSES[order.status] ?? []

  const handleConfirmCod = async () => {
    try {
      await confirmCodPayment(orderId).unwrap()
      toast.success('COD payment confirmed')
    } catch {
      toast.error('Failed to confirm payment')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{formatOrderNumber(order.orderNumber)}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(order.createdAt).toLocaleString('en-BD')}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="bg-white rounded-lg border p-5 space-y-2">
        <h2 className="font-semibold">Customer</h2>
        <p>{order.customer.name}</p>
        <p className="text-sm text-gray-500">{order.customer.phone}</p>
      </div>

      <div className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="py-2 flex justify-between text-sm">
              <span>
                {item.productNameSnapshot}
                {item.variantNameSnapshot && ` — ${item.variantNameSnapshot}`}
                {' '}×{item.quantity}
              </span>
              <span>৳{item.totalPrice.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-2 pt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span><span>৳{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span><span>৳{order.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total</span><span>৳{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.paymentMethod === 'cod' && order.status === 'delivered' && !order.isCodPaymentConfirmed && (
        <button
          onClick={handleConfirmCod}
          disabled={confirmingCod}
          className="w-full bg-green-600 text-white py-2 rounded font-medium"
        >
          {confirmingCod ? 'Confirming...' : 'Confirm COD Payment Received'}
        </button>
      )}
      {order.isCodPaymentConfirmed && (
        <p className="text-green-600 text-sm text-center">✓ COD payment confirmed</p>
      )}

      {nextActions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {nextActions.map(({ toStatus, label, variant }) => (
            <StatusUpdateButton
              key={toStatus}
              orderId={orderId}
              currentStatus={order.status}
              toStatus={toStatus}
              label={label}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  )
}
