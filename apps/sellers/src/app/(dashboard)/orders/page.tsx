import { Suspense } from 'react'
import { OrdersListPage } from '@/features/orders/components/OrdersListPage'

export default function Page() {
  return (
    <Suspense>
      <OrdersListPage />
    </Suspense>
  )
}
