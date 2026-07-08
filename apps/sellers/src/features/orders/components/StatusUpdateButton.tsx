'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateOrderStatusMutation } from '../api/ordersApi'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { getErrorMessage } from '@/lib/apiError'

interface Props {
  orderId: string
  currentStatus: string
  toStatus: string
  label: string
  variant?: 'primary' | 'danger' | 'secondary'
}

export function StatusUpdateButton({ orderId, currentStatus, toStatus, label, variant = 'primary' }: Props) {
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation()
  const [open, setOpen] = useState(false)

  const handleConfirm = async () => {
    try {
      await updateStatus({ id: orderId, status: toStatus }).unwrap()
      toast.success(`Order updated to: ${toStatus.replace(/_/g, ' ')}`)
      setOpen(false)
    } catch (err: unknown) {
      const e = err as { status?: number }
      const isReAttemptAllocFail =
        currentStatus === 'delivery_failed' &&
        toStatus === 'handover_to_courier' &&
        e?.status === 409
      if (isReAttemptAllocFail) {
        toast.error(
          'Could not re-attempt delivery — one or more items are no longer in stock. Check inventory before retrying.',
        )
      } else {
        toast.error(getErrorMessage(err, 'Update failed'))
      }
    }
  }

  const btnVariant = variant === 'primary' ? 'default' : 'outline'
  const btnClass = variant === 'danger' ? 'text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive' : ''

  return (
    <>
      <Button variant={btnVariant} size="sm" className={btnClass} onClick={() => setOpen(true)} disabled={isLoading}>
        {label}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm status change"
        description={`Move order from ${currentStatus.replace(/_/g, ' ')} to ${toStatus.replace(/_/g, ' ')}?`}
        confirmLabel="Confirm"
        destructive={variant === 'danger'}
        loading={isLoading}
        onConfirm={handleConfirm}
      />
    </>
  )
}
