import { Prisma } from '@prisma/client'

// Fields surfaced by the active-courier picker list.
export const courierListSelect = {
  id: true,
  name: true,
} satisfies Prisma.CourierSelect
