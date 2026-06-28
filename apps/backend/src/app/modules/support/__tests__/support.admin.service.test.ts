jest.mock('../../../../prisma/client', () => ({
  prismaAdmin: { supportTicket: { findUnique: jest.fn() } },
}))
jest.mock('../../../../shared/sse/manager', () => ({ sseManager: { push: jest.fn() } }))

import { prismaAdmin } from '../../../../prisma/client'
import { SupportAdminService } from '../support.admin.service'

const findUnique = prismaAdmin.supportTicket.findUnique as jest.Mock

describe('SupportAdminService.reply', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns null when the ticket does not exist', async () => {
    findUnique.mockResolvedValue(null)
    const result = await SupportAdminService.reply('t1', 'admin-1', 'hi')
    expect(result).toBeNull()
  })
})
