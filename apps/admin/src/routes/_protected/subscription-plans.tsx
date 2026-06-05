import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  useGetSubscriptionPlansQuery,
  useUpdateSubscriptionPlanMutation,
  type SubscriptionPlan,
} from '@/store/adminApiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function EditPlanDialog({ plan, onClose }: { plan: SubscriptionPlan; onClose: () => void }) {
  const [updatePlan, { isLoading }] = useUpdateSubscriptionPlanMutation()
  const [priceMonthly, setPriceMonthly] = useState(plan.priceMonthly)
  const [maxUsers, setMaxUsers] = useState(String(plan.maxUsers ?? ''))
  const [maxOrders, setMaxOrders] = useState(String(plan.maxOrdersPerMonth ?? ''))
  const [maxProducts, setMaxProducts] = useState(String(plan.maxProducts ?? ''))
  const [maxSkus, setMaxSkus] = useState(String(plan.maxSkus ?? ''))

  const handleSave = async () => {
    try {
      await updatePlan({
        id: plan.id,
        priceMonthly: parseFloat(String(priceMonthly)),
        maxUsers: maxUsers === '' ? null : parseInt(maxUsers),
        maxOrdersPerMonth: maxOrders === '' ? null : parseInt(maxOrders),
        maxProducts: maxProducts === '' ? null : parseInt(maxProducts),
        maxSkus: maxSkus === '' ? null : parseInt(maxSkus),
      }).unwrap()
      toast.success(`${plan.name} updated`)
      onClose()
    } catch {
      toast.error('Failed to update plan')
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit {plan.name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Price / month</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Max Users (blank = unlimited)</Label>
            <Input value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} placeholder="e.g. 3" />
          </div>
          <div className="space-y-1.5">
            <Label>Max Orders / month</Label>
            <Input value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} placeholder="e.g. 500" />
          </div>
          <div className="space-y-1.5">
            <Label>Max Products</Label>
            <Input value={maxProducts} onChange={(e) => setMaxProducts(e.target.value)} placeholder="e.g. 20" />
          </div>
          <div className="space-y-1.5">
            <Label>Max SKUs</Label>
            <Input value={maxSkus} onChange={(e) => setMaxSkus(e.target.value)} placeholder="e.g. 100" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </DialogContent>
  )
}

function SubscriptionPlansPage() {
  const { data: plans, isLoading } = useGetSubscriptionPlansQuery()
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Subscription Plans</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price/mo</TableHead>
            <TableHead>Max Users</TableHead>
            <TableHead>Max Orders</TableHead>
            <TableHead>Max Products</TableHead>
            <TableHead>Max SKUs</TableHead>
            <TableHead>Active</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            : plans?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="tabular-nums">{plan.priceMonthly}</TableCell>
                  <TableCell>{plan.maxUsers ?? '∞'}</TableCell>
                  <TableCell>{plan.maxOrdersPerMonth ?? '∞'}</TableCell>
                  <TableCell>{plan.maxProducts ?? '∞'}</TableCell>
                  <TableCell>{plan.maxSkus ?? '∞'}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'default' : 'outline'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={editingPlan?.id === plan.id}
                      onOpenChange={(open) => !open && setEditingPlan(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingPlan(plan)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      {editingPlan?.id === plan.id && (
                        <EditPlanDialog plan={editingPlan} onClose={() => setEditingPlan(null)} />
                      )}
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}

export const Route = createFileRoute('/_protected/subscription-plans')({
  component: SubscriptionPlansPage,
})
