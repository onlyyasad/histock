import type { InquiryStatus } from '@prisma/client'
import { prismaAdmin } from '../prisma/client'

export class InquiryService {
  list(status?: InquiryStatus) {
    return prismaAdmin.contactInquiry.findMany({
      where: { ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    })
  }

  getById(id: string) {
    return prismaAdmin.contactInquiry.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
  }

  async reply(inquiryId: string, content: string) {
    const message = await prismaAdmin.contactInquiryMessage.create({
      data: { inquiryId, fromAdmin: true, content },
    })
    await prismaAdmin.contactInquiry.update({
      where: { id: inquiryId },
      data: { status: 'in_progress' },
    })
    return message
  }

  resolve(inquiryId: string) {
    return prismaAdmin.contactInquiry.update({
      where: { id: inquiryId },
      data: { status: 'resolved' },
    })
  }
}
