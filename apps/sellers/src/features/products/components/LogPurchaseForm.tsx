'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { useLogPurchaseMutation } from '../store/productsApi'

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
      const e = err as { data?: { error?: string } }
      toast.error(e?.data?.error ?? 'Failed to log purchase')
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 bg-gray-50 rounded-lg p-4 border"
    >
      <h3 className="font-semibold">Log Purchase</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Purchase Date</label>
          <input
            {...form.register('entryDate')}
            type="date"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Qty Received</label>
          <input
            {...form.register('lotQuantity')}
            type="number"
            min="1"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {form.formState.errors.lotQuantity && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.lotQuantity.message}
            </p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm mb-1">Total Cost (৳)</label>
          <input
            {...form.register('totalCost')}
            type="number"
            min="0"
            step="0.01"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      {costPerUnit !== null && (
        <p className="text-sm text-gray-500">
          Cost per unit: <strong>৳{costPerUnit.toFixed(2)}</strong>
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 text-white py-2 rounded font-medium disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Log Purchase'}
      </button>
    </form>
  )
}
