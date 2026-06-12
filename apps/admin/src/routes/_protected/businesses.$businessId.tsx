import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import {
  useGetBusinessQuery,
  useUpdateSubscriptionMutation,
  useGetSubscriptionPlansQuery,
  useGetBusinessPaymentsQuery,
  useRecordPaymentMutation,
  useStartImpersonationMutation,
  useGetMeQuery,
  type SubscriptionPayment,
} from '@/store/adminApiSlice'
import { useSetBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import { PageHeader } from '@/components/shared/PageHeader'
import { BusinessStatusBadge } from '@/components/shared/BusinessStatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
const STATUSES = ['trial', 'active', 'grace_period', 'expired', 'cancelled'] as const

function BusinessDetailPage({ businessId }: { businessId: string }) {
  const { data: business, isLoading } = useGetBusinessQuery(businessId)
  const { data: plans } = useGetSubscriptionPlansQuery()
  const { data: me } = useGetMeQuery()
  const [updateSub, { isLoading: saving }] = useUpdateSubscriptionMutation()
  const { data: payments, isLoading: paymentsLoading } = useGetBusinessPaymentsQuery(businessId)
  const [recordPayment, { isLoading: recording }] = useRecordPaymentMutation()
  const [startImpersonation, { isLoading: impersonating }] = useStartImpersonationMutation()

  const [planId, setPlanId] = useState('')
  const [status, setStatus] = useState('')
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  const [overrideConfirmOpen, setOverrideConfirmOpen] = useState(false)
  const [impersonateOpen, setImpersonateOpen] = useState(false)

  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payPlanId, setPayPlanId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('')
  const [payRef, setPayRef] = useState('')
  const [payPeriodStart, setPayPeriodStart] = useState('')
  const [payPeriodEnd, setPayPeriodEnd] = useState('')
  const [payNotes, setPayNotes] = useState('')

  useSetBreadcrumbEntity(business?.name ?? null)

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!business) {
    return <div className="p-4 md:p-6 text-destructive">Business not found</div>
  }

  const planName = (id: string) => plans?.find((pl) => pl.id === id)?.name ?? id

  const handleSave = async () => {
    try {
      await updateSub({
        businessId,
        ...(planId ? { planId } : {}),
        ...(status ? { status } : {}),
        ...(currentPeriodEnd ? { currentPeriodEnd: new Date(currentPeriodEnd).toISOString() } : {}),
        ...(adminNotes ? { adminNotes } : {}),
      }).unwrap()
      toast.success('Subscription updated')
      setPlanId('')
      setStatus('')
      setCurrentPeriodEnd('')
      setAdminNotes('')
    } catch {
      toast.error('Failed to update')
    }
    setOverrideConfirmOpen(false)
  }

  const handleRecordPayment = async () => {
    try {
      await recordPayment({
        businessId,
        planId: payPlanId,
        amountPaid: parseFloat(payAmount),
        paymentMethod: payMethod,
        paymentRef: payRef || undefined,
        periodStart: new Date(payPeriodStart).toISOString(),
        periodEnd: new Date(payPeriodEnd).toISOString(),
        notes: payNotes || undefined,
      }).unwrap()
      toast.success('Payment recorded')
      setPayDialogOpen(false)
      setPayPlanId('')
      setPayAmount('')
      setPayMethod('')
      setPayRef('')
      setPayPeriodStart('')
      setPayPeriodEnd('')
      setPayNotes('')
    } catch {
      toast.error('Failed to record payment')
    }
  }

  const handleImpersonate = async () => {
    try {
      const { token } = await startImpersonation(businessId).unwrap()
      window.location.href =
        (import.meta.env.VITE_SELLERS_URL as string) + '/impersonate?token=' + token
    } catch {
      toast.error('Impersonation failed')
    }
  }

  const end = business.subscription.currentPeriodEnd
  const endDate = end ? new Date(end) : null
  const past = endDate ? endDate.getTime() < Date.now() : false
  const soon = endDate ? !past && endDate.getTime() - Date.now() < 7 * 86_400_000 : false

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={business.name}
        description={
          <span className="flex items-center gap-2">
            {business.slug}
            {business.isDemo && (
              <Badge variant="outline" className="text-xs border-warning/30 bg-warning/10 text-warning">Demo</Badge>
            )}
          </span>
        }
        actions={!me?.isDemo ? (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => setImpersonateOpen(true)}
            disabled={impersonating}
          >
            Impersonate
          </Button>
        ) : undefined}
      />

      <ConfirmDialog
        open={impersonateOpen}
        onOpenChange={setImpersonateOpen}
        title={`Impersonate ${business.name}?`}
        description="This opens a fully writable seller session as this business. Every action is recorded in the audit log."
        confirmLabel="Start impersonation"
        destructive
        onConfirm={handleImpersonate}
      />

      {/* 2-column layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
        {/* Main col (subscription + payments) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Subscription */}
          <Card>
            <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-sm font-medium">{business.subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <BusinessStatusBadge status={business.subscription.status} />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Override</p>
                <p className="text-xs text-warning">Changes apply immediately.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Plan</Label>
                    <Select value={planId} onValueChange={setPlanId}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Keep: ${business.subscription.plan.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {plans?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Keep current" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Period End</Label>
                  <Input
                    type="datetime-local"
                    value={currentPeriodEnd}
                    onChange={(e) => setCurrentPeriodEnd(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Admin Notes</Label>
                  <Input
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional internal note"
                  />
                </div>
                <Button
                  onClick={() => setOverrideConfirmOpen(true)}
                  disabled={saving || (!planId && !status && !currentPeriodEnd && !adminNotes)}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <ConfirmDialog
            open={overrideConfirmOpen}
            onOpenChange={setOverrideConfirmOpen}
            title="Save subscription override?"
            description="These changes apply immediately to the seller's account."
            confirmLabel="Save Changes"
            onConfirm={handleSave}
          />

          {/* Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Payments</CardTitle>
                <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Record Payment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Manual Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Plan</Label>
                        <Select value={payPlanId} onValueChange={setPayPlanId}>
                          <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                          <SelectContent>
                            {plans?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Amount Paid</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Payment Method</Label>
                          <Input
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value)}
                            placeholder="bkash / bank"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Reference (optional)</Label>
                        <Input
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          placeholder="Transaction ID"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Period Start</Label>
                          <Input
                            type="datetime-local"
                            value={payPeriodStart}
                            onChange={(e) => setPayPeriodStart(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Period End</Label>
                          <Input
                            type="datetime-local"
                            value={payPeriodEnd}
                            onChange={(e) => setPayPeriodEnd(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Notes (optional)</Label>
                        <Input
                          value={payNotes}
                          onChange={(e) => setPayNotes(e.target.value)}
                          placeholder="Internal note"
                        />
                      </div>
                      <Button
                        onClick={handleRecordPayment}
                        disabled={recording || !payPlanId || !payAmount || !payMethod || !payPeriodStart || !payPeriodEnd}
                        className="w-full"
                      >
                        {recording ? 'Recording…' : 'Record Payment'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <>
                  {/* Desktop payments table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Ref</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No payments recorded yet.
                            </TableCell>
                          </TableRow>
                        )}
                        {payments?.map((p: SubscriptionPayment) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">
                              {new Date(p.confirmedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{planName(p.planId)}</TableCell>
                            <TableCell>{p.paymentMethod}</TableCell>
                            <TableCell className="text-muted-foreground">{p.paymentRef ?? '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(p.periodStart).toLocaleDateString()} –{' '}
                              {new Date(p.periodEnd).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{p.amountPaid}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile payments cards */}
                  <div className="md:hidden space-y-2">
                    {payments?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p>
                    )}
                    {payments?.map((p: SubscriptionPayment) => (
                      <Card key={p.id}>
                        <CardContent className="py-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{planName(p.planId)}</p>
                            <p className="font-mono tabular-nums text-sm">{p.amountPaid}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.paymentMethod} · {p.paymentRef ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rail col (stats + team) */}
        <div className="lg:col-span-1 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Users</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{business._count.users}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Orders</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{business._count.orders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Plan</CardTitle></CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{business.subscription.plan.name}</p>
              </CardContent>
            </Card>
            <Card className={cn(past && 'bg-destructive/10 border-destructive/30', soon && 'bg-warning/10 border-warning/30')}>
              <CardHeader className="pb-1"><CardTitle className="text-sm">Period ends</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm font-semibold tabular-nums">
                  {endDate ? formatDate(endDate) : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team */}
          <Card>
            <CardHeader><CardTitle>Team</CardTitle></CardHeader>
            <CardContent>
              {/* Desktop team table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {business.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile team cards */}
              <div className="md:hidden space-y-2">
                {business.users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/businesses/$businessId')({
  component: () => {
    const { businessId } = Route.useParams()
    return <BusinessDetailPage businessId={businessId} />
  },
})
