import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import { prismaWithScope } from '../../../prisma/client'
import { streamCsv } from '../../../shared/csvStream'
import { ExportsService } from './exports.service'
import {
  ordersExportColumns,
  customersExportColumns,
  productsExportColumns,
} from './exports.constants'

const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const today = () => new Date().toISOString().slice(0, 10)

const exportOrders = catchAsync(async (req: Request, res: Response) => {
  const { from, to, status } = req.query as Record<string, string>
  const rows = await ExportsService.getOrderRows(scoped(req), { from, to, status })
  streamCsv(res, rows, ordersExportColumns, `orders-export-${today()}`)
})

const exportCustomers = catchAsync(async (req: Request, res: Response) => {
  const rows = await ExportsService.getCustomerRows(scoped(req))
  streamCsv(res, rows, customersExportColumns, `customers-export-${today()}`)
})

const exportProducts = catchAsync(async (req: Request, res: Response) => {
  const rows = await ExportsService.getProductRows(scoped(req))
  streamCsv(res, rows, productsExportColumns, `products-export-${today()}`)
})

export const ExportsController = {
  exportOrders,
  exportCustomers,
  exportProducts,
}
