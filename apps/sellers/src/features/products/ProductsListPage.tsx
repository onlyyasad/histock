'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Package, Plus } from 'lucide-react'
import { useGetProductsQuery } from './store/productsApi'
import { StockBadge } from './components/StockBadge'
import { ExportButton } from '@/features/exports/ExportButton'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton, ListSkeleton } from '@/components/shared/TableSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, fmtMoney } from '@/lib/utils'

function ProductsListInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')

  const lowStockOnly = searchParams.get('lowStock') === 'true'
  const setLowStockOnly = (on: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (on) params.set('lowStock', 'true')
    else params.delete('lowStock')
    router.replace(`/products${params.size ? `?${params}` : ''}`)
  }

  const { data: products, isLoading } = useGetProductsQuery({
    search: search || undefined,
    lowStock: lowStockOnly || undefined,
  })

  const hasFilters = search.length > 0 || lowStockOnly

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Products"
        description="Your catalog and current stock levels."
        actions={
          <>
            <ExportButton endpoint="/exports/products" label="Export CSV" filename="products.csv" />
            <Button asChild size="sm">
              <Link href="/products/new">
                <Plus className="mr-1 size-4" />
                New product
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex gap-3 items-center">
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Label className="flex items-center gap-2 text-sm cursor-pointer font-normal">
          <Checkbox
            id="low-stock-filter"
            checked={lowStockOnly}
            onCheckedChange={(checked) => setLowStockOnly(checked === true)}
          />
          Low stock only
        </Label>
      </div>

      {isLoading ? (
        <>
          <TableSkeleton className="hidden md:block" />
          <ListSkeleton className="md:hidden" />
        </>
      ) : !products || products.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Package}
            title="No products match"
            description="Try a different search or clear the low-stock filter."
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setLowStockOnly(false)
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your first product to start tracking stock and margins."
            action={
              <Button asChild size="sm">
                <Link href="/products/new">
                  <Plus className="mr-1 size-4" />
                  New product
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Variants</TableHead>
                  <TableHead className="text-right">Avg Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const margin = (p as unknown as { avgMarginPct: number | null }).avgMarginPct
                  const variantCount = (p.variants ?? []).length
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.sku ?? '—'}</TableCell>
                      <TableCell className="font-mono tabular-nums">৳{fmtMoney(p.price)}</TableCell>
                      <TableCell className="text-right">
                        <StockBadge stock={p.currentStock} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {variantCount > 0 ? variantCount : '—'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums text-sm',
                          margin === null
                            ? 'text-muted-foreground/40'
                            : margin < 10
                              ? 'text-destructive font-medium'
                              : 'text-success font-medium',
                        )}
                      >
                        {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="block rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  <span className="font-mono tabular-nums text-sm">৳{fmtMoney(p.price)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">SKU: {p.sku ?? '—'}</span>
                  <StockBadge stock={p.currentStock} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function ProductsListPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 space-y-6">
        <TableSkeleton className="hidden md:block" />
        <ListSkeleton className="md:hidden" />
      </div>
    }>
      <ProductsListInner />
    </Suspense>
  )
}
