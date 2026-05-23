'use client'

import { toast } from 'sonner'
import { useGetOrderQuery, useConfirmCodPaymentMutation } from './store/ordersApi'
import { OrderStatusBadge } from './components/OrderStatusBadge'
import { StatusUpdateButton } from './components/StatusUpdateButton'
import { formatOrderNumber } from './NewOrderPage'
import { InvoiceDownloadButton } from '@/features/invoices/InvoiceDownloadButton'
import { PrintableInvoice } from '@/features/invoices/PrintableInvoice'
import { CostBreakdownPanel } from './components/CostBreakdownPanel'
import { OrderNotesPanel } from './components/OrderNotesPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (isError || !order) return <div className="p-6 text-destructive">Order not found.</div>

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{formatOrderNumber(order.orderNumber)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date(order.createdAt).toLocaleString('en-BD')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <InvoiceDownloadButton
            data={{
              orderNumber: order.orderNumber,
              createdAt: order.createdAt,
              sellerName: 'HiStock Seller',
              customerName: order.customer.name,
              customerPhone: order.customer.phone,
              items: order.items.map((item) => ({
                productNameSnapshot: item.productNameSnapshot,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
              subtotal: order.subtotal,
              deliveryFee: order.deliveryFee,
              total: order.total,
              paymentMethod: order.paymentMethod,
            }}
          />
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <PrintableInvoice
        data={{
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          sellerName: 'HiStock Seller',
          customerName: order.customer.name,
          customerPhone: order.customer.phone,
          items: order.items.map((item) => ({
            productNameSnapshot: item.productNameSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          paymentMethod: order.paymentMethod,
        }}
      />

      <Card>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">Customer</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">Items</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="space-y-0">
            {order.items.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <Separator className="my-1" />}
                <div className="py-2 flex justify-between text-sm">
                  <span>
                    {item.productNameSnapshot}
                    {item.variantNameSnapshot && ` — ${item.variantNameSnapshot}`}
                    {' '}×{item.quantity}
                  </span>
                  <span>৳{item.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>৳{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span><span>৳{order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span><span>৳{order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.paymentMethod === 'cod' && order.status === 'delivered' && !order.isCodPaymentConfirmed && (
        <Button
          onClick={handleConfirmCod}
          disabled={confirmingCod}
          className="w-full"
        >
          {confirmingCod ? 'Confirming...' : 'Confirm COD Payment Received'}
        </Button>
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

      <OrderNotesPanel orderId={orderId} notes={order.orderNotes ?? []} />

      <SchedulePanel orderId={orderId} />

      <CostBreakdownPanel orderId={orderId} />
    </div>
  )
}
