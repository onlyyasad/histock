import type { CostEntry } from '../store/productsApi'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function LotHistoryTable({ entries }: { entries: CostEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No purchase history yet. Log a purchase to track cost.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
            <TableHead className="text-right">Per Unit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-right tabular-nums">{entry.lotQuantity}</TableCell>
              <TableCell
                className={cn(
                  'text-right tabular-nums',
                  entry.remainingQty === 0 && 'text-muted-foreground/40',
                )}
              >
                {entry.remainingQty}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                ৳{Number(entry.totalCost).toFixed(2)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                ৳{Number(entry.costPerUnit).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
