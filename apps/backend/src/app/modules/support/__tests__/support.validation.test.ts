import { SupportValidation } from '../support.validation'

describe('SupportValidation', () => {
  it('accepts a valid ticket', () => {
    const r = SupportValidation.createTicket.safeParse({
      body: { title: 'Bug', description: 'It broke', type: 'bug_report' },
    })
    expect(r.success).toBe(true)
  })

  it('rejects an unknown ticket type', () => {
    const r = SupportValidation.createTicket.safeParse({
      body: { title: 'x', description: 'y', type: 'nope' },
    })
    expect(r.success).toBe(false)
  })

  it('rejects an empty message body', () => {
    const r = SupportValidation.addMessage.safeParse({ body: { body: '' } })
    expect(r.success).toBe(false)
  })
})
