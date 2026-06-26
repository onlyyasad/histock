import { TeamValidation } from '../team.validation'

describe('TeamValidation', () => {
  it('accepts a staff invite', () => {
    const r = TeamValidation.createInvite.safeParse({ body: { email: 'a@b.com', role: 'staff' } })
    expect(r.success).toBe(true)
  })

  it('rejects an owner invite (not configurable)', () => {
    const r = TeamValidation.createInvite.safeParse({ body: { email: 'a@b.com', role: 'owner' } })
    expect(r.success).toBe(false)
  })

  it('rejects an accept body with a short password', () => {
    const r = TeamValidation.acceptInvite.safeParse({ body: { name: 'X', password: 'short' } })
    expect(r.success).toBe(false)
  })

  it('rejects an unknown permission', () => {
    const r = TeamValidation.updatePermission.safeParse({
      body: { role: 'manager', permission: 'nope', granted: true },
    })
    expect(r.success).toBe(false)
  })
})
