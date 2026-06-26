import { CustomersService } from '../customers.service'

type ListDb = Parameters<typeof CustomersService.list>[0]

function makeDb() {
  const findMany = jest.fn().mockResolvedValue([])
  const db = { customer: { findMany } } as unknown as ListDb
  return { db, findMany }
}

describe('CustomersService.list', () => {
  it('adds an OR search filter when search is provided', async () => {
    const { db, findMany } = makeDb()
    await CustomersService.list(db, { search: 'rah' })
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'rah', mode: 'insensitive' } },
            { phone: { contains: 'rah' } },
          ],
        },
      }),
    )
  })

  it('omits the where filter when no search is provided', async () => {
    const { db, findMany } = makeDb()
    await CustomersService.list(db, {})
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})
