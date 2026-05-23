'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useUpdateOrderStatusMutation } from '../store/ordersApi'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatOrderNumber } from '../NewOrderPage'
import { toast } from 'sonner'

interface Props {
  orderId: string
  orderNumber: number
  customerName: string
  status: string
  total: number
}

const SWIPE_THRESHOLD = 80  // px — minimum swipe to trigger reveal
const SWIPE_MAX = 140       // px — max card offset when revealed

export function SwipeableOrderCard({ orderId, orderNumber, customerName, status, total }: Props) {
  const [offset, setOffset] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const startX = useRef(0)
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation()

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) {
      setOffset(Math.max(dx, -SWIPE_MAX))
    }
  }

  const handleTouchEnd = () => {
    if (offset < -SWIPE_THRESHOLD) {
      setIsRevealed(true)
      setOffset(-SWIPE_MAX)
    } else {
      setIsRevealed(false)
      setOffset(0)
    }
  }

  const handleClose = () => {
    setIsRevealed(false)
    setOffset(0)
  }

  const handleMarkProcessing = async () => {
    if (isLoading) return
    try {
      await updateStatus({ id: orderId, status: 'processing' }).unwrap()
      toast.success('Order marked as processing')
      handleClose()
    } catch {
      toast.error('Failed to update order')
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ touchAction: 'pan-y' }}>
      {/* Action buttons revealed by left swipe */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {status === 'pending' && (
          <button
            onClick={handleMarkProcessing}
            disabled={isLoading}
            className="w-[70px] bg-blue-600 text-white text-xs flex flex-col items-center justify-center gap-1 disabled:opacity-50"
          >
            <span className="text-lg">▶</span>
            <span>Process</span>
          </button>
        )}
        <button
          onClick={handleClose}
          className="w-[70px] bg-gray-400 text-white text-xs flex flex-col items-center justify-center gap-1"
        >
          <span className="text-lg">✕</span>
          <span>Close</span>
        </button>
      </div>

      {/* Card body — slides left on swipe */}
      <Link
        href={`/orders/${orderId}`}
        className="bg-white border rounded-lg p-4 relative z-10 flex items-center justify-between block"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isRevealed || offset === 0 ? 'transform 0.2s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (isRevealed) e.preventDefault()
        }}
      >
        <div>
          <p className="font-mono text-sm font-medium">{formatOrderNumber(orderNumber)}</p>
          <p className="text-gray-500 text-sm">{customerName}</p>
        </div>
        <div className="text-right space-y-1">
          <OrderStatusBadge status={status} />
          <p className="text-sm font-medium">৳{total.toFixed(2)}</p>
        </div>
      </Link>
    </div>
  )
}
