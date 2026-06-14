'use client'

import { toast } from 'sonner'
import { useConfirmCodPaymentMutation } from '../store/ordersApi'
import { PaymentMethodBadge } from '@/components/shared/PaymentMethodBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  orderId: string
  paymentMethod: string
  status: string
  isCodPaymentConfirmed: boolean
}

export function PaymentPanel({ orderId, paymentMethod, status, isCodPaymentConfirmed }: Props) {
  const [confirmCodPayment, { isLoading }] = useConfirmCodPaymentMutation()

  const handleConfirmCod = async () => {
    try {
      await confirmCodPayment(orderId).unwrap()
      toast.success('COD payment confirmed')
    } catch {
      toast.error('Failed to confirm payment')
    }
  }

  const showConfirm = paymentMethod === 'cod' && status === 'delivered' && !isCodPaymentConfirmed

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">Payment</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Method</span>
          <PaymentMethodBadge method={paymentMethod} />
        </div>
        {isCodPaymentConfirmed && (
          <p className="text-sm text-success">✓ COD payment received</p>
        )}
        {showConfirm && (
          <Button size="sm" className="w-full" onClick={handleConfirmCod} disabled={isLoading}>
            {isLoading ? 'Confirming…' : 'Confirm COD payment received'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
