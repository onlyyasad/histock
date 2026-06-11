'use client'

import Link from 'next/link'
import { formatOrderNumber, formatDateTime } from '@/lib/format'
import { fmtMoney } from '@/lib/utils'
import { useGetOrderQuery } from './store/ordersApi'
import { OrderMetadataPanel } from './components/OrderMetadataPanel'
import { OrderStatusBadge } from './components/OrderStatusBadge'
import { StatusUpdateButton } from './components/StatusUpdateButton'
import { InvoiceDownloadButton } from '@/features/invoices/InvoiceDownloadButton'
import { PrintableInvoice } from '@/features/invoices/PrintableInvoice'
import { CostBreakdownPanel } from './components/CostBreakdownPanel'
import { OrderNotesPanel } from './components/OrderNotesPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { useSetBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import { PaymentPanel } from './components/PaymentPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

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

  useSetBreadcrumbEntity(order ? formatOrderNumber(order.orderNumber) : null)

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    )
  }
  if (isError || !order) return <div className="p-6 text-destructive">Order not found.</div>

  const nextActions = NEXT_STATUSES[order.status] ?? []

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={<span className="font-mono">{formatOrderNumber(order.orderNumber)}</span>}
        description={
          order.updatedAt !== order.createdAt
            ? `Created ${formatDateTime(order.createdAt)} · Updated ${formatDateTime(order.updatedAt)}`
            : `Created ${formatDateTime(order.createdAt)}`
        }
        actions={
          <>
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
          </>
        }
      />

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

      <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
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
                      <span className="font-mono tabular-nums">৳{fmtMoney(item.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="font-mono tabular-nums">৳{fmtMoney(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span><span className="font-mono tabular-nums">৳{fmtMoney(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span><span className="font-mono tabular-nums">৳{fmtMoney(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>

        {/* Side rail */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold">Customer</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="font-medium">{order.customer.name}</p>
              <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
              <Link href={`/customers/${order.customer.id}`} className="text-sm text-primary hover:underline">
                View customer
              </Link>
            </CardContent>
          </Card>

          <PaymentPanel
            orderId={orderId}
            paymentMethod={order.paymentMethod}
            status={order.status}
            isCodPaymentConfirmed={order.isCodPaymentConfirmed}
          />

          <OrderMetadataPanel
            orderId={orderId}
            currentCourierId={order.courier?.id ?? null}
            currentTags={order.tags ?? []}
            currentNotes={order.notes ?? null}
          />

          <SchedulePanel orderId={orderId} />

          <CostBreakdownPanel orderId={orderId} />
        </div>
      </div>
    </div>
  )
}

