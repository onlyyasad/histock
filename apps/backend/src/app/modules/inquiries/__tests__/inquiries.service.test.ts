jest.mock('../../../../prisma/client', () => ({
  prismaAdmin: {
    contactInquiryMessage: { create: jest.fn().mockResolvedValue({ id: 'm1' }) },
    contactInquiry: { update: jest.fn().mockResolvedValue({}) },
  },
}))

import { prismaAdmin } from '../../../../prisma/client'
import { InquiriesService } from '../inquiries.service'

const update = prismaAdmin.contactInquiry.update as jest.Mock

describe('InquiriesService.reply', () => {
  beforeEach(() => jest.clearAllMocks())

  it('moves the inquiry to in_progress after creating the reply', async () => {
    await InquiriesService.reply('inq-1', 'hello')
    expect(update).toHaveBeenCalledWith({
      where: { id: 'inq-1' },
      data: { status: 'in_progress' },
    })
  })
})
