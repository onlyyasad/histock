jest.mock('../../../../prisma/client', () => ({
  prismaAdmin: { business: { findMany: jest.fn().mockResolvedValue([]) } },
}))

import { prismaAdmin } from '../../../../prisma/client'
import { BusinessesService } from '../businesses.service'

const findMany = prismaAdmin.business.findMany as jest.Mock

describe('BusinessesService.list', () => {
  beforeEach(() => jest.clearAllMocks())

  it('paginates with page size 30', async () => {
    await BusinessesService.list({ page: 2 })
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 30, take: 30 }))
  })

  it('builds a case-insensitive search OR filter', async () => {
    await BusinessesService.list({ search: 'acme' })
    const arg = findMany.mock.calls[0][0]
    expect(arg.where.OR).toEqual([
      { name: { contains: 'acme', mode: 'insensitive' } },
      { slug: { contains: 'acme', mode: 'insensitive' } },
    ])
  })
})
