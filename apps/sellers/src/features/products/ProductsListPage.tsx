'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGetProductsQuery } from './store/productsApi'
import { ExportButton } from '@/features/exports/ExportButton'
import { buttonVariants } from '@/components/ui/button'
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

export function ProductsListPage() {
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const { data: products, isLoading } = useGetProductsQuery({
    search: search || undefined,
    lowStock: lowStockOnly || undefined,
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <ExportButton endpoint="/exports/products" label="Export CSV" filename="products.csv" />
          <Link href="/products/new" className={cn(buttonVariants({ size: 'sm' }))}>
            + New Product
          </Link>
        </div>
      </div>

      <div className="flex gap-3 mb-4 items-center">
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

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="text-right">Avg Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((p) => {
              const margin = (p as unknown as { avgMarginPct: number | null }).avgMarginPct
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">৳{fmtMoney(p.price)}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums',
                      p.currentStock <= 5 && 'text-destructive font-medium',
                    )}
                  >
                    {p.currentStock}
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
    </div>
  )
}
