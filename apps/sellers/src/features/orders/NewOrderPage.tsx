'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { newOrderFormSchema, type NewOrderFormValues } from './schemas/newOrderFormSchema'
import { useCreateOrderMutation } from './store/ordersApi'

export function formatOrderNumber(n: number): string {
  return `ORD-${String(n).padStart(6, '0')}`
}

export function NewOrderPage() {
  const router = useRouter()
  const [createOrder, { isLoading }] = useCreateOrderMutation()
  const [phoneLookup, setPhoneLookup] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<{
    id: string
    name: string
    phone: string
  } | null>(null)

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues: {
      customerId: '',
      courierId: null,
      paymentMethod: 'cod',
      deliveryFee: 0,
      items: [{ productId: '', variantId: null, quantity: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  const handlePhoneLookup = async () => {
    if (!phoneLookup) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customers/lookup?phone=${encodeURIComponent(phoneLookup)}`,
        { credentials: 'include' },
      )
      if (!res.ok) {
        toast.info('Customer not found — check the phone number')
        return
      }
      const customer = (await res.json()) as { id: string; name: string; phone: string }
      setFoundCustomer(customer)
      form.setValue('customerId', customer.id)
      toast.success(`Found: ${customer.name}`)
    } catch {
      toast.error('Lookup failed')
    }
  }

  const onSubmit = async (values: NewOrderFormValues) => {
    try {
      const order = await createOrder(values).unwrap()
      toast.success(`Order ${formatOrderNumber(order.orderNumber)} created`)
      router.push(`/orders/${order.id}`)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; code?: string } }
      if (e?.data?.code === 'ORDER_CAP_REACHED') {
        toast.error(e.data.error ?? 'Monthly order limit reached')
      } else {
        toast.error(e?.data?.error ?? 'Failed to create order')
      }
    }
  }

  const items = form.watch('items')
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    0,
  )
  const deliveryFee = Number(form.watch('deliveryFee')) || 0
  const total = subtotal + deliveryFee

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">New Order</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Customer Phone</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneLookup}
              onChange={(e) => setPhoneLookup(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePhoneLookup())}
              placeholder="01711234567"
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={handlePhoneLookup}
              className="px-4 py-2 bg-gray-100 rounded border"
            >
              Lookup
            </button>
          </div>
          {foundCustomer && (
            <p className="text-sm text-green-600 mt-1">
              ✓ {foundCustomer.name} — {foundCustomer.phone}
            </p>
          )}
          {form.formState.errors.customerId && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.customerId.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select {...form.register('paymentMethod')} className="w-full border rounded px-3 py-2">
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Items</label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <input
                  {...form.register(`items.${index}.productId`)}
                  placeholder="Product ID"
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <input
                  {...form.register(`items.${index}.quantity`)}
                  type="number"
                  min="1"
                  placeholder="Qty"
                  className="w-20 border rounded px-3 py-2 text-sm"
                />
                <input
                  {...form.register(`items.${index}.unitPrice`)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price (৳)"
                  className="w-32 border rounded px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 text-sm py-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => append({ productId: '', variantId: null, quantity: 1, unitPrice: 0 })}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Add Item
          </button>
          {form.formState.errors.items && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.items.root?.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Delivery Fee (৳)</label>
          <input
            {...form.register('deliveryFee')}
            type="number"
            min="0"
            step="0.01"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="bg-gray-50 rounded p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>৳{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>৳{deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>৳{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded font-medium disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Order'}
        </button>
      </form>
    </div>
  )
}
