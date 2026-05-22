'use client'

import { useRouter } from 'next/navigation'
import { InlineCreateCustomer } from './components/InlineCreateCustomer'

export function NewCustomerPage() {
  const router = useRouter()

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">New Customer</h1>
      <InlineCreateCustomer
        onCreated={(customer) => router.push(`/customers/${customer.id}`)}
        onCancel={() => router.back()}
      />
    </div>
  )
}
