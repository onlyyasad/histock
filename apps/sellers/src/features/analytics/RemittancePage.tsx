'use client'

import { useGetRemittancesQuery } from './store/analyticsApi'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function fmt(amount: number) {
  return `৳${Number(amount).toFixed(2)}`
}

export function RemittancePage() {
  const { data: batches, isLoading } = useGetRemittancesQuery()

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">COD Remittance Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track cash-on-delivery payments expected from couriers after delivery.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      <div className="space-y-3">
        {batches?.map((batch) => (
          <Card key={batch.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{batch.courier.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{batch.batchName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {batch.totalOrders} orders · Expected: {fmt(batch.totalCodAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(batch.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={batch.status === 'received' ? 'default' : 'secondary'}>
                  {batch.status === 'received' ? 'Received' : 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && batches?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No remittance batches yet.</p>
        )}
      </div>
    </div>
  )
}
