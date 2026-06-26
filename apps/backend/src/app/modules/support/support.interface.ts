import type { TicketType } from '@prisma/client'

export type ICreateTicketInput = {
  title: string
  description: string
  type: TicketType
}

export type IAddMessageInput = {
  body: string
}
