import type { InquiryStatus } from '@prisma/client'
import { prismaAdmin } from '../../../prisma/client'

const list = (status?: InquiryStatus) =>
  prismaAdmin.contactInquiry.findMany({
    where: { ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { messages: true } } },
  })

const getById = (id: string) =>
  prismaAdmin.contactInquiry.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

const reply = async (inquiryId: string, content: string) => {
  const message = await prismaAdmin.contactInquiryMessage.create({
    data: { inquiryId, fromAdmin: true, content },
  })
  await prismaAdmin.contactInquiry.update({
    where: { id: inquiryId },
    data: { status: 'in_progress' },
  })
  return message
}

const resolve = (inquiryId: string) =>
  prismaAdmin.contactInquiry.update({ where: { id: inquiryId }, data: { status: 'resolved' } })

export const InquiriesService = { list, getById, reply, resolve }
