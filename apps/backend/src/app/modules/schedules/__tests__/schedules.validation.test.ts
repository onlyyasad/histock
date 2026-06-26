import { ScheduleValidation } from '../schedules.validation'

describe('ScheduleValidation', () => {
  it('accepts a valid create body', () => {
    const r = ScheduleValidation.createSchedule.safeParse({
      body: { title: 'Call customer', scheduledAt: '2026-07-01T10:00:00.000Z' },
    })
    expect(r.success).toBe(true)
  })

  it('rejects a non-datetime scheduledAt', () => {
    const r = ScheduleValidation.createSchedule.safeParse({
      body: { title: 'x', scheduledAt: 'not-a-date' },
    })
    expect(r.success).toBe(false)
  })

  it('accepts an empty list query', () => {
    const r = ScheduleValidation.listSchedules.safeParse({ query: {} })
    expect(r.success).toBe(true)
  })
})
