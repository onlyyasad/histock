import { Suspense } from 'react'
import { OrdersListPage } from '@/features/orders/OrdersListPage'

export default function Page() {
  return (
    <Suspense>
      <OrdersListPage />
    </Suspense>
  )
}
