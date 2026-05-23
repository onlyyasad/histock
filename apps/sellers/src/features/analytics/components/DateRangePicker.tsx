'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      <div className="flex items-center gap-2 ml-1">
        <Input
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="w-36 h-8 text-sm"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="w-36 h-8 text-sm"
        />
      </div>
    </div>
  )
}
