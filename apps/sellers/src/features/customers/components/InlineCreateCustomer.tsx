'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateCustomerMutation } from '../api/customersApi'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/apiError'

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
      toast.error(getErrorMessage(err, 'Failed to create customer'))
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm text-primary">Create New Customer</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="ic-name">Full name</Label>
            <Input id="ic-name" {...form.register('name')} placeholder="Full name" />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="ic-phone">Phone number</Label>
            <Input id="ic-phone" {...form.register('phone')} type="tel" placeholder="Phone number" />
            {form.formState.errors.phone && (
              <p className="text-destructive text-xs">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create & Use'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
