'use client'

import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { newOrderFormSchema, type NewOrderFormValues } from './schemas/newOrderFormSchema'
import { useCreateOrderMutation } from './store/ordersApi'
import { fmtMoney } from '@/lib/utils'
import { useGetProductsQuery } from '@/features/products/store/productsApi'
import { useGetCouriersQuery } from '@/features/financials/store/financialsApi'
import { useLazyLookupCustomerQuery } from '@/features/customers/store/customersApi'
import { InlineCreateCustomer } from '@/features/customers/components/InlineCreateCustomer'
import { ProductCombobox } from './components/ProductCombobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatOrderNumber } from '@/lib/format'
import { getErrorMessage, getErrorCode } from '@/lib/apiError'

export function NewOrderPage() {
  const router = useRouter()
  const [createOrder, { isLoading }] = useCreateOrderMutation()
  const { data: products = [] } = useGetProductsQuery({})
  const { data: couriers = [] } = useGetCouriersQuery()
  const [lookupCustomer] = useLazyLookupCustomerQuery()

  const [phoneLookup, setPhoneLookup] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<{
    id: string; name: string; phone: string
  } | null>(null)
  const [showInlineCreate, setShowInlineCreate] = useState(false)

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
      const customer = await lookupCustomer(phoneLookup).unwrap()
      if (!customer) {
        toast.info('Customer not found — create them below')
        setShowInlineCreate(true)
        return
      }
      setFoundCustomer(customer)
      setShowInlineCreate(false)
      form.setValue('customerId', customer.id)
      toast.success(`Found: ${customer.name}`)
    } catch {
      toast.error('Lookup failed')
    }
  }

  const handleCustomerCreated = (customer: { id: string; name: string; phone: string }) => {
    setFoundCustomer(customer)
    setShowInlineCreate(false)
    form.setValue('customerId', customer.id)
  }

  const onSubmit = async (values: NewOrderFormValues) => {
    try {
      const result = await createOrder(values).unwrap()
      const resultWithWarning = result as typeof result & { warning?: { type: string; used: number; cap: number } }
      if (resultWithWarning.warning?.type === 'ORDER_CAP_NEAR') {
        const w = resultWithWarning.warning
        toast.warning(`You've used ${w.used} of ${w.cap} orders this month.`)
      }
      toast.success(`Order ${formatOrderNumber(result.orderNumber)} created`)
      router.push(`/orders/${result.id}`)
    } catch (err: unknown) {
      if (getErrorCode(err) === 'ORDER_CAP_REACHED') {
        toast.error(getErrorMessage(err, 'Monthly order limit reached'))
      } else {
        toast.error(getErrorMessage(err, 'Failed to create order'))
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

  const stepQuantity = (index: number, delta: number) => {
    const current = Number(form.getValues(`items.${index}.quantity`)) || 1
    form.setValue(`items.${index}.quantity`, Math.max(1, current + delta), { shouldValidate: true })
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">New Order</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Customer lookup */}
        <div className="space-y-2">
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
            <Card>
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{foundCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{foundCustomer.phone}</p>
                </div>
                <Link href={`/customers/${foundCustomer.id}`} className="text-sm text-primary hover:underline shrink-0">
                  View
                </Link>
              </CardContent>
            </Card>
          )}
          {form.formState.errors.customerId && (
            <p className="text-destructive text-sm">{form.formState.errors.customerId.message}</p>
          )}
        </div>

        {showInlineCreate && (
          <InlineCreateCustomer
            prefillPhone={phoneLookup}
            onCreated={handleCustomerCreated}
            onCancel={() => setShowInlineCreate(false)}
          />
        )}

        {/* Courier */}
        <div className="space-y-1">
          <Label>Courier (optional)</Label>
          <Controller
            control={form.control}
            name="courierId"
            render={({ field }) => (
              <Select
                value={field.value ?? '__none__'}
                onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign courier later" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No courier yet</SelectItem>
                  {couriers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Payment method */}
        <div className="space-y-1">
          <Label>Payment Method</Label>
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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

        {/* Order items */}
        <div>
          <Label className="mb-2 block">Items</Label>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const selectedProductId = form.watch(`items.${index}.productId`)
              const selectedProduct = products.find((p) => p.id === selectedProductId)
              const variants = selectedProduct?.variants ?? []
              const lineTotal = (Number(items[index]?.quantity) || 0) * (Number(items[index]?.unitPrice) || 0)

              return (
                <Card key={field.id}>
                  <CardContent className="p-3 space-y-2">
                    <Controller
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field: f }) => (
                        <ProductCombobox
                          products={products}
                          value={f.value || ''}
                          onSelect={(id) => {
                            f.onChange(id)
                            form.setValue(`items.${index}.variantId`, null)
                            const prod = products.find((p) => p.id === id)
                            if (prod) form.setValue(`items.${index}.unitPrice`, prod.price)
                          }}
                        />
                      )}
                    />

                    {variants.length > 0 && (
                      <Controller
                        control={form.control}
                        name={`items.${index}.variantId`}
                        render={({ field: f }) => (
                          <Select
                            value={f.value ?? '__none__'}
                            onValueChange={(v) => {
                              f.onChange(v === '__none__' ? null : v)
                              const variant = variants.find((vt) => vt.id === v)
                              if (variant) {
                                form.setValue(`items.${index}.unitPrice`, variant.price)
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select variant..." />
                            </SelectTrigger>
                            <SelectContent>
                              {variants.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.name} — ৳{fmtMoney(v.price)} · {v.currentStock} left
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    )}

                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="shrink-0"
                          onClick={() => stepQuantity(index, -1)} aria-label="Decrease quantity">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          {...form.register(`items.${index}.quantity`)}
                          type="number"
                          min="1"
                          inputMode="numeric"
                          className="w-16 text-center"
                          aria-label="Quantity"
                        />
                        <Button type="button" variant="outline" size="icon" className="shrink-0"
                          onClick={() => stepQuantity(index, 1)} aria-label="Increase quantity">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Input
                          {...form.register(`items.${index}.unitPrice`)}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Unit price (৳)"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                        disabled={fields.length === 1}
                      >
                        ✕
                      </Button>
                    </div>

                    <p className="text-right text-sm text-muted-foreground">
                      Line total <span className="font-mono tabular-nums text-foreground">৳{lineTotal.toFixed(2)}</span>
                    </p>
                  </CardContent>
                </Card>
              )
            })}
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

        {/* Delivery fee */}
        <div className="space-y-1">
          <Label>Delivery Fee (৳)</Label>
          <div className="flex gap-2">
            {[0, 60, 120].map((fee) => (
              <Button
                key={fee}
                type="button"
                variant={deliveryFee === fee ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => form.setValue('deliveryFee', fee, { shouldValidate: true })}
              >
                ৳{fee}
              </Button>
            ))}
          </div>
          <Input {...form.register('deliveryFee')} type="number" min="0" step="0.01" inputMode="decimal" />
        </div>

        {/* Desktop summary + submit */}
        <div className="hidden md:block space-y-6">
          <Card>
            <CardContent className="p-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span><span>৳{deliveryFee.toFixed(2)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span><span>৳{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create order'}
          </Button>
        </div>

        {/* Mobile sticky total + submit */}
        <div className="md:hidden sticky bottom-0 -mx-4 border-t bg-background p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-semibold font-mono tabular-nums">৳{total.toFixed(2)}</p>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
