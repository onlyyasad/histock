'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateOrderStatusMutation } from '../store/ordersApi'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

  const btnVariant = variant === 'primary' ? 'default' : variant === 'danger' ? 'destructive' : 'outline'

  return (
    <>
      <Button variant={btnVariant} size="sm" onClick={() => setOpen(true)} disabled={isLoading}>
        {label}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Move order from <strong>{currentStatus.replace(/_/g, ' ')}</strong> to{' '}
              <strong>{toStatus.replace(/_/g, ' ')}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
