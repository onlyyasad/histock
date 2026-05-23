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

function formatOrderNumber(n: number) {
  return `ORD-${String(n).padStart(6, '0')}`
}

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const { data: customer, isLoading } = useGetCustomerQuery(customerId)
  const [flagCustomer, { isLoading: isFlagging }] = useFlagCustomerMutation()
  const [unflagCustomer, { isLoading: isUnflagging }] = useUnflagCustomerMutation()
  const [flagReason, setFlagReason] = useState('')
  const [showFlagForm, setShowFlagForm] = useState(false)

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!customer) return <div className="p-6 text-red-500">Customer not found</div>

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
          <p className="text-gray-500">{customer.phone}</p>
          {customer.email && <p className="text-gray-500 text-sm">{customer.email}</p>}
        </div>
        <div>
          {customer.isFlagged ? (
            <div className="text-right">
              <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                Flagged: {customer.flagReason}
              </span>
              <button
                onClick={handleUnflag}
                disabled={isUnflagging}
                className="block mt-2 text-xs text-gray-500 hover:underline"
              >
                Remove flag
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowFlagForm(true)}
              className="text-sm text-red-600 hover:underline"
            >
              Flag customer
            </button>
          )}
        </div>
      </div>

      {showFlagForm && (
        <div className="bg-red-50 border border-red-200 rounded p-4 space-y-3">
          <p className="text-sm font-medium text-red-700">Reason for flagging:</p>
          <input
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="e.g. Repeated non-payment"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleFlag}
              disabled={isFlagging}
              className="text-sm bg-red-600 text-white px-4 py-1.5 rounded"
            >
              Flag
            </button>
            <button
              onClick={() => setShowFlagForm(false)}
              className="text-sm border px-4 py-1.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-xl font-bold">৳{customer.totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-xl font-bold">{customer.totalOrders}</p>
        </div>
      </div>

      <AddressBook customerId={customerId} addresses={customer.addresses} />

      <div>
        <h2 className="font-semibold mb-3">Order History</h2>
        <div className="space-y-2">
          {customer.orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between bg-white border rounded p-3 hover:shadow-sm text-sm"
            >
              <span className="font-mono">{formatOrderNumber(order.orderNumber)}</span>
              <span className="text-gray-500">{order.status.replace(/_/g, ' ')}</span>
              <span className="font-medium">৳{order.total.toFixed(2)}</span>
            </Link>
          ))}
          {customer.orders.length === 0 && (
            <p className="text-gray-400 text-sm">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
