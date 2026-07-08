'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { useLogPurchaseMutation } from '../api/productsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/apiError'

const schema = z.object({
  entryDate: z.string().min(1, 'Date required'),
  lotQuantity: z.coerce.number().int().positive('Must be at least 1'),
  totalCost: z.coerce.number().nonnegative(),
})

type FormValues = z.infer<typeof schema>

export function LogPurchaseForm({ productId, onSuccess }: { productId: string; onSuccess?: () => void }) {
  const [logPurchase, { isLoading }] = useLogPurchaseMutation()
  const idempotencyKey = useMemo(() => uuidv4(), [])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entryDate: new Date().toISOString().slice(0, 10),
      lotQuantity: 1,
      totalCost: 0,
    },
  })

  const totalCost = Number(form.watch('totalCost')) || 0
  const lotQuantity = Number(form.watch('lotQuantity')) || 0
  const costPerUnit = lotQuantity > 0 && totalCost > 0 ? totalCost / lotQuantity : null

  const onSubmit = async (values: FormValues) => {
    try {
      await logPurchase({
        productId,
        idempotencyKey,
        entryDate: values.entryDate,
        lotQuantity: values.lotQuantity,
        totalCost: values.totalCost,
      }).unwrap()
      toast.success('Purchase logged')
      form.reset()
      onSuccess?.()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to log purchase'))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Log Purchase</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="lp-date">Purchase Date</Label>
              <Input id="lp-date" {...form.register('entryDate')} type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lp-qty">Qty Received</Label>
              <Input id="lp-qty" {...form.register('lotQuantity')} type="number" min="1" />
              {form.formState.errors.lotQuantity && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.lotQuantity.message}
                </p>
              )}
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="lp-cost">Total Cost (৳)</Label>
              <Input
                id="lp-cost"
                {...form.register('totalCost')}
                type="number"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {costPerUnit !== null && (
            <p className="text-sm text-muted-foreground">
              Cost per unit: <strong>৳{costPerUnit.toFixed(2)}</strong>
            </p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : 'Log Purchase'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
