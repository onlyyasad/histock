'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { useCreateProductMutation } from './store/productsApi'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  name: z.string().min(1, 'Name required').max(300),
  sku: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().nonnegative('Must be 0 or more'),
})

type FormValues = z.infer<typeof schema>

export function NewProductPage() {
  const router = useRouter()
  const [createProduct, { isLoading }] = useCreateProductMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', sku: '', description: '', price: 0 },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const product = await createProduct({
        name: values.name,
        sku: values.sku || undefined,
        description: values.description || undefined,
        price: values.price,
      }).unwrap()
      toast.success('Product created')
      router.push(`/products/${product.id}`)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      toast.error(e?.data?.error ?? 'Failed to create product')
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <Link href="/products" className="text-sm text-muted-foreground hover:underline mb-4 block">
        ← Products
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Product</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="np-name">Name *</Label>
          <Input
            id="np-name"
            {...form.register('name')}
            placeholder="Product name"
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="np-sku">SKU (optional)</Label>
          <Input
            id="np-sku"
            {...form.register('sku')}
            placeholder="e.g. PROD-001"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="np-price">Selling Price (৳)</Label>
          <Input
            id="np-price"
            {...form.register('price')}
            type="number"
            min="0"
            step="0.01"
          />
          {form.formState.errors.price && (
            <p className="text-destructive text-xs">{form.formState.errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="np-desc">Description (optional)</Label>
          <Textarea
            id="np-desc"
            {...form.register('description')}
            rows={3}
            placeholder="Optional product notes"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Product'}
        </Button>
      </form>
    </div>
  )
}
