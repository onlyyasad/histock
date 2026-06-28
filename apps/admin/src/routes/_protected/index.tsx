import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import {
  useGetBusinessesQuery,
  useToggleDemoMutation,
  useGetSubscriptionPlansQuery,
} from '@/store/adminApiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Paginator } from '@/components/shared/Paginator'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { BusinessStatusBadge } from '@/components/shared/BusinessStatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

function BusinessListPage() {
  const [search, setSearch] = useState('')
  const [planId, setPlanId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pendingDemo, setPendingDemo] = useState<{ id: string; name: string; next: boolean } | null>(null)

  const { data: businesses, isLoading } = useGetBusinessesQuery({
    search: search || undefined,
    planId: planId || undefined,
    page,
  })
  const { data: plans } = useGetSubscriptionPlansQuery()
  const [toggleDemo] = useToggleDemoMutation()

  const visible = statusFilter
    ? businesses?.filter((b) => b.subscription?.status === statusFilter)
    : businesses

  const handleDemoToggle = async (id: string, currentIsDemo: boolean) => {
    try {
      await toggleDemo({ businessId: id, isDemo: !currentIsDemo }).unwrap()
      toast.success(currentIsDemo ? 'Demo mode disabled' : 'Demo mode enabled')
    } catch {
      toast.error('Failed to update')
    }
    setPendingDemo(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Businesses" description="All seller workspaces on the platform" />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full sm:max-w-xs"
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
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="grace_period">Grace period</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {statusFilter && (
        <p className="text-xs text-muted-foreground">Status filter applies to the current page only.</p>
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        {isLoading ? (
          <TableSkeleton />
        ) : (
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
              {visible?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="No businesses found"
                      description="Try a different search or clear the filters."
                      action={
                        (search || planId || statusFilter) ? (
                          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setPlanId(''); setStatusFilter('') }}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                visible?.map((b) => (
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
                      {b.subscription ? (
                        <Badge variant="secondary">{b.subscription.plan.name}</Badge>
                      ) : (
                        <Badge variant="outline">No subscription</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.subscription ? (
                        <BusinessStatusBadge status={b.subscription.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={b.isDemo}
                        onCheckedChange={(next) => setPendingDemo({ id: b.id, name: b.name, next })}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono">
                      {b._count.orders}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-32" />
                <div className="h-3 bg-muted rounded animate-pulse w-20" />
              </CardContent>
            </Card>
          ))
        ) : visible?.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No businesses found"
            description="Try a different search or clear the filters."
            action={
              (search || planId || statusFilter) ? (
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setPlanId(''); setStatusFilter('') }}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          visible?.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to="/businesses/$businessId"
                      params={{ businessId: b.id }}
                      className="font-medium hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{b.slug}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {b.subscription ? (
                      <>
                        <Badge variant="secondary">{b.subscription.plan.name}</Badge>
                        <BusinessStatusBadge status={b.subscription.status} />
                      </>
                    ) : (
                      <Badge variant="outline">No subscription</Badge>
                    )}
                  </div>
                  <Switch
                    checked={b.isDemo}
                    onCheckedChange={(next) => setPendingDemo({ id: b.id, name: b.name, next })}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-mono tabular-nums">
                  {b._count.orders} orders
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Paginator
        page={page}
        onPageChange={setPage}
        hasNext={(businesses?.length ?? 0) >= 20}
      />

      <ConfirmDialog
        open={!!pendingDemo}
        onOpenChange={(o) => !o && setPendingDemo(null)}
        title={pendingDemo?.next ? `Enable demo mode for ${pendingDemo?.name}?` : `Disable demo mode for ${pendingDemo?.name}?`}
        description={pendingDemo?.next ? 'All admin mutations will be gated to demo data.' : 'This workspace will be treated as a real seller account again.'}
        confirmLabel={pendingDemo?.next ? 'Enable demo' : 'Disable demo'}
        onConfirm={() => pendingDemo && handleDemoToggle(pendingDemo.id, !pendingDemo.next)}
      />
    </div>
  )
}

export const Route = createFileRoute('/_protected/')({
  component: BusinessListPage,
})
