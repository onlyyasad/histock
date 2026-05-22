import type { CostEntry } from '../store/productsApi'

export function LotHistoryTable({ entries }: { entries: CostEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No purchase history yet. Log a purchase to track cost.
      </p>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="text-left text-gray-500 border-b">
        <tr>
          <th className="pb-2">Date</th>
          <th className="pb-2 text-right">Qty</th>
          <th className="pb-2 text-right">Remaining</th>
          <th className="pb-2 text-right">Total Cost</th>
          <th className="pb-2 text-right">Per Unit</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id} className="border-b">
            <td className="py-2">{new Date(entry.entryDate).toLocaleDateString()}</td>
            <td className="py-2 text-right tabular-nums">{entry.lotQuantity}</td>
            <td
              className={`py-2 text-right tabular-nums ${
                entry.remainingQty === 0 ? 'text-gray-300' : ''
              }`}
            >
              {entry.remainingQty}
            </td>
            <td className="py-2 text-right tabular-nums">৳{Number(entry.totalCost).toFixed(2)}</td>
            <td className="py-2 text-right tabular-nums">৳{Number(entry.costPerUnit).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
