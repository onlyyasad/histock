'use client'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'

interface Props {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
}

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function DateRangePicker({ from, to, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.days}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ from: daysAgo(p.days), to: new Date().toISOString().slice(0, 10) })}
        >
          {p.label}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const now = new Date()
          const first = new Date(now.getFullYear(), now.getMonth(), 1)
          onChange({ from: first.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) })
        }}
      >
        This month
      </Button>
      <div className="flex items-center gap-2 ml-1">
        <DatePicker
          value={from || undefined}
          onSelect={(date) => onChange({ from: date, to })}
          placeholder="Start date"
          className="w-36 text-sm"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <DatePicker
          value={to || undefined}
          onSelect={(date) => onChange({ from, to: date })}
          placeholder="End date"
          className="w-36 text-sm"
        />
      </div>
    </div>
  )
}
