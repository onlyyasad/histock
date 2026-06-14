export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString('en-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelative(iso: string | Date): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86_400_000], ['hour', 3_600_000], ['minute', 60_000],
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'minute') return RTF.format(Math.round(diffMs / ms), unit)
  }
  return 'now'
}
