'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useGetOrdersQuery } from './store/ordersApi'
import { useGetCouriersQuery } from '@/features/financials/store/financialsApi'
import { OrderStatusBadge } from './components/OrderStatusBadge'
import { SwipeableOrderCard } from './components/SwipeableOrderCard'
import { formatOrderNumber } from '@/lib/format'
import { PAYMENT_METHOD_LABELS } from '@/lib/format'
import { ExportButton } from '@/features/exports/ExportButton'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, fmtMoney } from '@/lib/utils'

const ORDER_STATUSES = [
  { value: '__all__', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'handover_to_courier', label: 'With courier' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delivery_failed', label: 'Delivery failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const PAGE_SIZE = 30

export function OrdersListPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const status = searchParams.get('status') ?? '__all__'
  const courierId = searchParams.get('courierId') ?? '__all__'
  const paymentMethod = searchParams.get('paymentMethod') ?? '__all__'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '' || value === '__all__') next.delete(key)
      else next.set(key, value)
    }
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const hasActiveFilters = status !== '__all__' || courierId !== '__all__' || paymentMethod !== '__all__' || !!from || !!to

  const { data: couriers = [] } = useGetCouriersQuery()

  const { data: orders, isLoading, isError, isFetching } = useGetOrdersQuery({
    status: status !== '__all__' ? status : undefined,
    courierId: courierId !== '__all__' ? courierId : undefined,
    paymentMethod: paymentMethod !== '__all__' ? paymentMethod : undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: PAGE_SIZE,
  })

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
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-2">
          <ExportButton
            endpoint="/exports/orders"
            label="Export CSV"
            filename="orders.csv"
            params={{
              status: status !== '__all__' ? status : undefined,
              from: from || undefined,
              to: to || undefined,
            }}
          />
          <Link href="/orders/new" className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px]')}>
            + New Order
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-muted/40 rounded-lg">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={status}
            onValueChange={(v) => { if (v) updateParams({ status: v, page: null }) }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Courier</Label>
          <Select
            value={courierId}
            onValueChange={(v) => { if (v) updateParams({ courierId: v, page: null }) }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All couriers</SelectItem>
              {couriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Payment</Label>
          <Select value={paymentMethod} onValueChange={(v) => { if (v) updateParams({ paymentMethod: v, page: null }) }}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All methods</SelectItem>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <DatePicker
            value={from || undefined}
            onSelect={(date) => updateParams({ from: date, page: null })}
            placeholder="From date"
            className="h-9 w-full"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <DatePicker
            value={to || undefined}
            onSelect={(date) => updateParams({ to: date, page: null })}
            placeholder="To date"
            className="h-9 w-full"
          />
        </div>

        {hasActiveFilters && (
          <div className="col-span-2 md:col-span-5 flex justify-end">
            <Button variant="ghost" size="sm"
              onClick={() => updateParams({ status: null, courierId: null, paymentMethod: null, from: null, to: null, page: null })}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {isFetching && !isLoading && (
        <p className="text-xs text-muted-foreground">Refreshing...</p>
      )}

      {/* Mobile: swipeable cards */}
      <div className="space-y-2 md:hidden">
        {orders?.length === 0 && (
          <p className="p-6 text-muted-foreground text-center">No orders match your filters.</p>
        )}
        {orders?.map((order) => (
          <SwipeableOrderCard
            key={order.id}
            orderId={order.id}
            orderNumber={order.orderNumber}
            customerName={order.customer.name}
            status={order.status}
            total={order.total}
          />
        ))}
      </div>

      {/* Desktop: list */}
      <Card className="hidden md:block divide-y overflow-hidden">
        {orders?.length === 0 && (
          <p className="p-6 text-muted-foreground text-center">No orders match your filters.</p>
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
                <p className="text-sm font-medium">৳{fmtMoney(order.total)}</p>
              </div>
            </Link>
          </div>
        ))}
      </Card>

      {/* Pagination */}
      {(orders?.length ?? 0) === PAGE_SIZE && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateParams({ page: String(page + 1) })}
            disabled={isFetching}
          >
            {isFetching ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
      {page > 1 && (orders?.length ?? 0) < PAGE_SIZE && (
        <p className="text-center text-xs text-muted-foreground">All orders loaded</p>
      )}
    </div>
  )
}
