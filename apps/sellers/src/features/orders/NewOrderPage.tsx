'use client'

import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { newOrderFormSchema, type NewOrderFormValues } from './schemas/newOrderFormSchema'
import { useCreateOrderMutation } from './store/ordersApi'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
        <div className="space-y-1">
          <Label>Customer Phone</Label>
          <div className="flex gap-2">
            <Input
              type="tel"
              value={phoneLookup}
              onChange={(e) => setPhoneLookup(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePhoneLookup())}
              placeholder="01711234567"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handlePhoneLookup}>
              Lookup
            </Button>
          </div>
          {foundCustomer && (
            <p className="text-sm text-green-600 mt-1">
              ✓ {foundCustomer.name} — {foundCustomer.phone}
            </p>
          )}
          {form.formState.errors.customerId && (
            <p className="text-destructive text-sm mt-1">
              {form.formState.errors.customerId.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Payment Method</Label>
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label className="mb-2 block">Items</Label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <Input
                  {...form.register(`items.${index}.productId`)}
                  placeholder="Product ID"
                  className="flex-1"
                />
                <Input
                  {...form.register(`items.${index}.quantity`)}
                  type="number"
                  min="1"
                  placeholder="Qty"
                  className="w-20"
                />
                <Input
                  {...form.register(`items.${index}.unitPrice`)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price (৳)"
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ productId: '', variantId: null, quantity: 1, unitPrice: 0 })}
            className="mt-2 text-primary"
          >
            + Add Item
          </Button>
          {form.formState.errors.items && (
            <p className="text-destructive text-sm mt-1">
              {form.formState.errors.items.root?.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="no-delivery">Delivery Fee (৳)</Label>
          <Input
            id="no-delivery"
            {...form.register('deliveryFee')}
            type="number"
            min="0"
            step="0.01"
          />
        </div>

        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>৳{deliveryFee.toFixed(2)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Order'}
        </Button>
      </form>
    </div>
  )
}
