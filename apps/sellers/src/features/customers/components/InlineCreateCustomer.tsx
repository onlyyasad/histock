'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateCustomerMutation } from '../store/customersApi'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
})

interface Props {
  prefillPhone?: string
  onCreated: (customer: { id: string; name: string; phone: string }) => void
  onCancel: () => void
}

export function InlineCreateCustomer({ prefillPhone, onCreated, onCancel }: Props) {
  const [createCustomer, { isLoading }] = useCreateCustomerMutation()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: prefillPhone ?? '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const customer = await createCustomer(values).unwrap()
      toast.success(`Customer "${customer.name}" created`)
      onCreated({ id: customer.id, name: customer.name, phone: customer.phone })
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      toast.error(e?.data?.error ?? 'Failed to create customer')
    }
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
      <p className="text-sm font-medium text-blue-700">Create New Customer</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <input
          {...form.register('name')}
          placeholder="Full name"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {form.formState.errors.name && (
          <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
        )}
        <input
          {...form.register('phone')}
          placeholder="Phone number"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {form.formState.errors.phone && (
          <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 rounded text-sm"
          >
            {isLoading ? 'Creating...' : 'Create & Use'}
          </button>
          <button type="button" onClick={onCancel} className="border rounded py-2 px-4 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
