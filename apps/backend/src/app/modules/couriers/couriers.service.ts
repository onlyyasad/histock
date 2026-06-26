import { prismaAdmin } from '../../../prisma/client'
import { courierListSelect } from './couriers.constants'

// Courier is a GLOBAL table (no businessId) — must use prismaAdmin, not the scoped client.
const listActive = () =>
  prismaAdmin.courier.findMany({
    where: { isActive: true },
    select: courierListSelect,
    orderBy: { name: 'asc' },
  })

export const CouriersService = {
  listActive,
}
