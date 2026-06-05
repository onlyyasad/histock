import { formatDate, formatDateTime } from '@/lib/formatDate'

describe('formatDate', () => {
  it('formats a date-only string', () => {
    // Construct in local time to avoid timezone shifts between server and CI
    const d = new Date(2026, 5, 5) // June 5, 2026 local midnight
    expect(formatDate(d.toISOString())).toBe('5 Jun 2026')
  })

  it('pads single-digit day', () => {
    const d = new Date(2026, 0, 3) // Jan 3
    expect(formatDate(d.toISOString())).toBe('3 Jan 2026')
  })
})

describe('formatDateTime', () => {
  it('includes hours and minutes', () => {
    const d = new Date(2026, 5, 5, 14, 30) // June 5, 2026 14:30 local
    expect(formatDateTime(d.toISOString())).toBe('5 Jun 2026, 14:30')
  })

  it('pads single-digit minutes', () => {
    const d = new Date(2026, 5, 5, 9, 5) // 09:05
    expect(formatDateTime(d.toISOString())).toBe('5 Jun 2026, 09:05')
  })
})
