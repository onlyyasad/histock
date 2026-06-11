import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  useGetBusinessesQuery,
  useToggleDemoMutation,
  useGetSubscriptionPlansQuery,
} from '@/store/adminApiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Paginator } from '@/components/shared/Paginator'

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'active') return 'default'
  if (status === 'trial') return 'secondary'
  return 'outline'
}

function BusinessListPage() {
  const [search, setSearch] = useState('')
  const [planId, setPlanId] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data: businesses, isLoading } = useGetBusinessesQuery({
    search: search || undefined,
    planId: planId || undefined,
    page,
  })
  const { data: plans } = useGetSubscriptionPlansQuery()
  const [toggleDemo] = useToggleDemoMutation()

  const handleDemoToggle = async (id: string, current: boolean) => {
    try {
      await toggleDemo({ businessId: id, isDemo: !current }).unwrap()
      toast.success(current ? 'Demo mode disabled' : 'Demo mode enabled')
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Businesses</h1>

      <div className="flex gap-3">
        <Input
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
        <Select value={planId} onValueChange={(v) => { setPlanId(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {plans?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Demo</TableHead>
            <TableHead className="text-right">Orders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                </TableRow>
              ))
            : businesses?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link
                      to="/businesses/$businessId"
                      params={{ businessId: b.id }}
                      className="font-medium hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{b.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{b.subscription.plan.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(b.subscription.status)}>
                      {b.subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={b.isDemo ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleDemoToggle(b.id, b.isDemo)}
                    >
                      {b.isDemo ? 'Demo' : 'Off'}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {b._count.orders}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <Paginator
        page={page}
        onPageChange={setPage}
        hasNext={(businesses?.length ?? 0) >= 20}
      />
    </div>
  )
}

export const Route = createFileRoute('/_protected/')({
  component: BusinessListPage,
})
