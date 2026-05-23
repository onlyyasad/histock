'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  useGetCustomerQuery,
  useFlagCustomerMutation,
  useUnflagCustomerMutation,
} from './store/customersApi'
import { AddressBook } from './components/AddressBook'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function formatOrderNumber(n: number) {
  return `ORD-${String(n).padStart(6, '0')}`
}

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const { data: customer, isLoading } = useGetCustomerQuery(customerId)
  const [flagCustomer, { isLoading: isFlagging }] = useFlagCustomerMutation()
  const [unflagCustomer, { isLoading: isUnflagging }] = useUnflagCustomerMutation()
  const [flagReason, setFlagReason] = useState('')
  const [showFlagForm, setShowFlagForm] = useState(false)

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (!customer) return <div className="p-6 text-destructive">Customer not found</div>

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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.phone}</p>
          {customer.email && <p className="text-muted-foreground text-sm">{customer.email}</p>}
        </div>
        <div>
          {customer.isFlagged ? (
            <div className="text-right space-y-2">
              <Badge variant="destructive">Flagged: {customer.flagReason}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnflag}
                disabled={isUnflagging}
                className="block text-xs text-muted-foreground"
              >
                Remove flag
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFlagForm(true)}
              className="text-destructive hover:text-destructive"
            >
              Flag customer
            </Button>
          )}
        </div>
      </div>

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
              <Button
                size="sm"
                variant="destructive"
                onClick={handleFlag}
                disabled={isFlagging}
              >
                Flag
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFlagForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-xl font-bold">৳{customer.totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-xl font-bold">{customer.totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      <AddressBook customerId={customerId} addresses={customer.addresses} />

      <div>
        <h2 className="font-semibold mb-3">Order History</h2>
        <div className="space-y-2">
          {customer.orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between bg-card border rounded-lg p-3 hover:shadow-sm transition-shadow text-sm"
            >
              <span className="font-mono">{formatOrderNumber(order.orderNumber)}</span>
              <span className="text-muted-foreground">{order.status.replace(/_/g, ' ')}</span>
              <span className="font-medium">৳{order.total.toFixed(2)}</span>
            </Link>
          ))}
          {customer.orders.length === 0 && (
            <p className="text-muted-foreground text-sm">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
