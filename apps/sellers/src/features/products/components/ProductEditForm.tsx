'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useUpdateProductMutation } from '../store/productsApi'
import type { ProductWithCosts } from '../store/productsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  name: z.string().min(1, 'Name required').max(300),
  sku: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().nonnegative(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  product: ProductWithCosts
  onClose: () => void
}

export function ProductEditForm({ product, onClose }: Props) {
  const [updateProduct, { isLoading }] = useUpdateProductMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product.name,
      sku: product.sku ?? '',
      description: product.description ?? '',
      price: product.price,
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProduct({
        id: product.id,
        name: values.name,
        sku: values.sku || undefined,
        description: values.description || undefined,
        price: values.price,
      }).unwrap()
      toast.success('Product updated')
      onClose()
    } catch {
      toast.error('Failed to update product')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">Edit Product</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>SKU</Label>
            <Input {...form.register('sku')} placeholder="Optional" />
          </div>
          <div className="space-y-1">
            <Label>Selling Price (৳)</Label>
            <Input {...form.register('price')} type="number" min="0" step="0.01" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...form.register('description')} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} size="sm">
              {isLoading ? 'Saving...' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
