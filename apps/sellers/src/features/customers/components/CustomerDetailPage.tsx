'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ShoppingBag } from 'lucide-react'
import {
  useGetCustomerQuery,
  useUpdateCustomerMutation,
  useFlagCustomerMutation,
  useUnflagCustomerMutation,
} from '../api/customersApi'
import { AddressBook } from './AddressBook'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatOrderNumber, formatDate } from '@/lib/format'
import { fmtMoney } from '@/lib/utils'
import { useSetBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const { data: customer, isLoading } = useGetCustomerQuery(customerId)
  const [flagCustomer, { isLoading: isFlagging }] = useFlagCustomerMutation()
  const [unflagCustomer, { isLoading: isUnflagging }] = useUnflagCustomerMutation()
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation()
  const [flagReason, setFlagReason] = useState('')
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' })

  useSetBreadcrumbEntity(customer?.name ?? null)

  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? '',
      })
    }
  }, [customer])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }
  if (!customer) return <div className="p-6 text-destructive">Customer not found</div>

  const avgOrder = customer.totalOrders > 0
    ? fmtMoney(customer.totalSpent / customer.totalOrders)
    : null

  const handleFlag = async () => {
    if (!flagReason.trim()) return
    try {
      await flagCustomer({ id: customerId, reason: flagReason }).unwrap()
      toast.success('Customer flagged')
      setShowFlagForm(false)
      setFlagReason('')
    } catch {
      toast.error('Failed to flag customer')
    }
  }

  const handleUnflag = async () => {
    try {
      await unflagCustomer(customerId).unwrap()
      toast.success('Flag removed')
    } catch {
      toast.error('Failed to remove flag')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateCustomer({
        id: customerId,
        name: editForm.name.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
      }).unwrap()
      toast.success('Customer updated')
      setShowEdit(false)
    } catch {
      toast.error('Failed to update customer')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title={customer.name}
        description={`${customer.phone}${customer.email ? ` · ${customer.email}` : ''}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowEdit((v) => !v)}>
              {showEdit ? 'Cancel' : 'Edit'}
            </Button>
            {!customer.isFlagged && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFlagForm(true)}
                className="text-destructive hover:text-destructive"
              >
                Flag customer
              </Button>
            )}
          </>
        }
      />

      {customer.isFlagged && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-destructive">Flagged customer</p>
            <p className="text-muted-foreground mt-0.5">{customer.flagReason}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnflag}
            disabled={isUnflagging}
            className="text-xs text-muted-foreground shrink-0"
          >
            Remove flag
          </Button>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
        {/* Main column: Order history */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-semibold mb-3">Order history</h2>

            {customer.orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="Orders placed by this customer will appear here."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link href={`/orders/${order.id}`} className="font-mono hover:underline">
                              {formatOrderNumber(order.orderNumber)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                          <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                          <TableCell className="text-right font-mono tabular-nums">৳{fmtMoney(order.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {customer.orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex flex-col bg-card border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{formatOrderNumber(order.orderNumber)}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                        <span className="font-mono text-xs text-muted-foreground">৳{fmtMoney(order.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Side rail */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total spent</p>
                <p className="text-lg font-semibold tabular-nums font-mono">৳{fmtMoney(customer.totalSpent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-lg font-semibold tabular-nums">{customer.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Avg order</p>
                <p className="text-lg font-semibold tabular-nums font-mono">
                  {avgOrder ? `৳${avgOrder}` : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          <AddressBook customerId={customerId} addresses={customer.addresses} />

          {showEdit && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <form onSubmit={handleEdit} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={updating}>
                    {updating ? 'Saving...' : 'Save changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {showFlagForm && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium text-destructive">Reason for flagging:</p>
                <Input
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g. Repeated non-payment"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleFlag} disabled={isFlagging}>
                    Flag
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowFlagForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
