import { describe, expect, it } from 'vitest'
import { humanizeAuditAction, parseAuditAction } from './audit'

describe('parseAuditAction', () => {
  it('splits a "METHOD /path" action string', () => {
    expect(parseAuditAction('POST /support-tickets/abc/messages')).toEqual({
      method: 'POST',
      path: '/support-tickets/abc/messages',
    })
  })

  it('uppercases the method', () => {
    expect(parseAuditAction('patch /inquiries/1').method).toBe('PATCH')
  })

  it('handles a string with no method', () => {
    expect(parseAuditAction('/orders')).toEqual({ method: '', path: '/orders' })
  })
})

describe('humanizeAuditAction', () => {
  it('turns the reported raw route into a readable label', () => {
    const id = 'e77c950d-1fe3-4cb9-baf2-2011faf957ec'
    expect(humanizeAuditAction(`POST /support-tickets/${id}/messages`)).toBe(
      'Created support tickets messages',
    )
  })

  it('maps HTTP verbs to readable actions', () => {
    expect(humanizeAuditAction('PATCH /inquiries/42')).toBe('Updated inquiries')
    expect(
      humanizeAuditAction('DELETE /businesses/e77c950d-1fe3-4cb9-baf2-2011faf957ec'),
    ).toBe('Deleted businesses')
  })

  it('drops uuid and numeric id segments', () => {
    expect(humanizeAuditAction('PATCH /businesses/7/subscription')).toBe(
      'Updated businesses subscription',
    )
  })

  it('falls back gracefully for unknown methods', () => {
    expect(humanizeAuditAction('OPTIONS /health')).toBe('Action on health')
  })
})
