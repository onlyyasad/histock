'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateOrderStatusMutation } from '../store/ordersApi'

interface Props {
  orderId: string
  currentStatus: string
  toStatus: string
  label: string
  variant?: 'primary' | 'danger' | 'secondary'
}

export function StatusUpdateButton({
  orderId,
  currentStatus,
  toStatus,
  label,
  variant = 'primary',
}: Props) {
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClick = async () => {
    try {
      await updateStatus({ id: orderId, status: toStatus }).unwrap()
      toast.success(`Order updated to: ${toStatus.replace(/_/g, ' ')}`)
      setShowConfirm(false)
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string } }
      const isReAttemptAllocFail =
        currentStatus === 'delivery_failed' &&
        toStatus === 'handover_to_courier' &&
        e?.status === 409
      if (isReAttemptAllocFail) {
        toast.error(
          'Could not re-attempt delivery — one or more items are no longer in stock. Check inventory before retrying.',
        )
      } else {
        toast.error(e?.data?.error ?? 'Update failed')
      }
    }
  }

  const classes = {
    primary: 'bg-indigo-600 text-white',
    danger: 'bg-red-600 text-white',
    secondary: 'bg-gray-100 text-gray-700 border',
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={`px-4 py-2 rounded text-sm font-medium ${classes[variant]}`}
        disabled={isLoading}
      >
        {label}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold mb-2">Confirm Status Change</h3>
            <p className="text-sm text-gray-500 mb-4">
              Move order from <strong>{currentStatus.replace(/_/g, ' ')}</strong> to{' '}
              <strong>{toStatus.replace(/_/g, ' ')}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClick}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 rounded text-sm"
              >
                {isLoading ? 'Updating...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
