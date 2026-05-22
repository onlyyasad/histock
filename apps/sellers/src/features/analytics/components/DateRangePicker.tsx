'use client'

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
    <div className="flex flex-wrap items-center gap-3">
      {PRESETS.map((p) => (
        <button
          key={p.days}
          type="button"
          onClick={() => onChange({ from: daysAgo(p.days), to: new Date().toISOString().slice(0, 10) })}
          className="text-sm px-3 py-1.5 border rounded-full hover:bg-gray-50"
        >
          {p.label}
        </button>
      ))}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="border rounded px-2 py-1.5 text-sm"
        />
        <span className="text-gray-400">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="border rounded px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  )
}
