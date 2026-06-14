'use client'

import Link from 'next/link'
import { Upload, Banknote } from 'lucide-react'
import { useGetRemittancesQuery } from './store/analyticsApi'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton, ListSkeleton } from '@/components/shared/TableSkeleton'
import { fmtMoney } from '@/lib/utils'
import { formatDate } from '@/lib/format'

export function RemittanceStatusBadge({ status }: { status: string }) {
  return status === 'received' ? (
    <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
      Received
    </Badge>
  ) : (
    <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
      Pending
    </Badge>
  )
}

export function RemittancePage() {
  const { data: batches, isLoading } = useGetRemittancesQuery()

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="COD remittance"
        description="Track cash-on-delivery payments expected from couriers after delivery."
        actions={
          <Link href="/remittance/import" className={buttonVariants({ size: 'sm' })}>
            <Upload className="size-4 mr-1.5" />
            Import CSV
          </Link>
        }
      />

      {isLoading && (
        <>
          <div className="hidden md:block">
            <TableSkeleton rows={5} />
          </div>
          <div className="md:hidden">
            <ListSkeleton rows={5} />
          </div>
        </>
      )}

      {!isLoading && batches?.length === 0 && (
        <EmptyState
          icon={Banknote}
          title="No remittance batches yet"
          description="Import a courier CSV to start tracking your COD payouts."
        />
      )}

      {!isLoading && batches && batches.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Courier</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Batch</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Orders</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Expected</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/remittance/${batch.id}`} className="hover:underline">
                        {batch.courier.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Link href={`/remittance/${batch.id}`} className="hover:underline">
                        {batch.batchName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{batch.totalOrders}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">৳{fmtMoney(batch.totalCodAmount)}</td>
                    <td className="px-4 py-3">{formatDate(batch.createdAt)}</td>
                    <td className="px-4 py-3">
                      <RemittanceStatusBadge status={batch.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {batches.map((batch) => (
              <Link key={batch.id} href={`/remittance/${batch.id}`} className="block">
                <div className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{batch.courier.name}</span>
                    <RemittanceStatusBadge status={batch.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{batch.batchName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {batch.totalOrders} orders ·{' '}
                    <span className="font-mono tabular-nums">৳{fmtMoney(batch.totalCodAmount)}</span>
                    {' · '}
                    {formatDate(batch.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
