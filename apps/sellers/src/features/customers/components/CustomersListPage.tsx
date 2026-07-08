'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { useGetCustomersQuery } from '../api/customersApi'
import { ExportButton } from '@/features/exports/ExportButton'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton, ListSkeleton } from '@/components/shared/TableSkeleton'
import { formatDate } from '@/lib/format'
import { cn, fmtMoney } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CustomersListPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const flaggedOnly = searchParams.get('flagged') === '1'

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const { data: customers, isLoading } = useGetCustomersQuery({ search: search || undefined })

  const hasActiveFilters = !!search || flaggedOnly
  const visible = (customers ?? []).filter((c) => !flaggedOnly || c.isFlagged)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone who has ever ordered from you."
        actions={
          <>
            <ExportButton endpoint="/exports/customers" label="Export CSV" filename="customers.csv" />
            <Link href="/customers/new" className={cn(buttonVariants({ size: 'sm' }), 'min-h-[44px]')}>
              <Plus className="h-4 w-4 mr-1" />
              New customer
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => updateParams({ search: e.target.value })}
          className="max-w-md"
        />
        <Label className="flex items-center gap-2 text-sm cursor-pointer font-normal">
          <Checkbox checked={flaggedOnly} onCheckedChange={(c) => updateParams({ flagged: c === true ? '1' : null })} />
          Flagged only
        </Label>
      </div>

      {isLoading ? (
        <>
          <TableSkeleton rows={8} className="hidden md:block" />
          <ListSkeleton rows={5} className="md:hidden" />
        </>
      ) : visible.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={Users}
            title="No customers match"
            description="Try a different search or clear the flag filter."
            action={
              <Button variant="ghost" size="sm" onClick={() => updateParams({ search: null, flagged: null })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Customers are created automatically when you log an order, or add one manually."
            action={
              <Link href="/customers/new" className={cn(buttonVariants({ size: 'sm' }))}>
                New customer
              </Link>
            }
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total spent</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      {c.isFlagged && (
                        <Badge variant="destructive" className="ml-2 text-xs">Flagged</Badge>
                      )}
                    </TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.totalOrders}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">৳{fmtMoney(c.totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {visible.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center justify-between bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{c.name}</span>
                    {c.isFlagged && (
                      <Badge variant="destructive" className="text-xs shrink-0">Flagged</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.phone} · {c.totalOrders} orders</p>
                </div>
                <span className="font-mono tabular-nums text-sm ml-3 shrink-0">৳{fmtMoney(c.totalSpent)}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
