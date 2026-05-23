'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { useCreateProductMutation } from './store/productsApi'

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
      <Link href="/products" className="text-sm text-gray-400 hover:underline mb-4 block">
        ← Products
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Product</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            {...form.register('name')}
            placeholder="Product name"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SKU (optional)</label>
          <input
            {...form.register('sku')}
            placeholder="e.g. PROD-001"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Selling Price (৳)</label>
          <input
            {...form.register('price')}
            type="number"
            min="0"
            step="0.01"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {form.formState.errors.price && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea
            {...form.register('description')}
            rows={3}
            placeholder="Optional product notes"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  )
}
