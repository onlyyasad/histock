import { Request, Response } from 'express'
import { OrderStatus } from '@prisma/client'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { prismaWithScope } from '../../../prisma/client'
import { OrdersService } from './orders.service'

const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId
const userIdOf = (req: Request) => (req.user as { id: string }).id

const list = catchAsync(async (req: Request, res: Response) => {
  const { status, courierId, paymentMethod, from, to, page, limit } = req.query
  const data = await OrdersService.list(scoped(req), {
    status: status as OrderStatus | undefined,
    courierId: courierId as string | undefined,
    paymentMethod: paymentMethod as string | undefined,
    from: from as string | undefined,
    to: to as string | undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 30,
  })
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved',
    data,
  })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await OrdersService.getById(scoped(req), req.params.id as string)
  if (!data) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found')
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved',
    data,
  })
})

const create = catchAsync(async (req: Request, res: Response) => {
  const { order, warning } = await OrdersService.create(businessIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order created',
    data: { ...order, warning: warning ?? null },
  })
})

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  await OrdersService.transition({
    orderId: req.params.id as string,
    businessId: businessIdOf(req),
    toStatus: req.body.status,
    reason: req.body.reason,
    userId: userIdOf(req),
  })
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order status updated',
    data: null,
  })
})

const updateMetadata = catchAsync(async (req: Request, res: Response) => {
  const data = await OrdersService.updateMetadata(scoped(req), req.params.id as string, req.body)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order updated',
    data,
  })
})

const remove = catchAsync(async (req: Request, res: Response) => {
  await OrdersService.softDelete(scoped(req), req.params.id as string)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order deleted',
    data: null,
  })
})

const getCostBreakdown = catchAsync(async (req: Request, res: Response) => {
  const data = await OrdersService.getCostBreakdown(
    scoped(req),
    businessIdOf(req),
    req.params.id as string,
  )
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cost breakdown retrieved',
    data,
  })
})

const addNote = catchAsync(async (req: Request, res: Response) => {
  const data = await OrdersService.addNote(
    scoped(req),
    businessIdOf(req),
    userIdOf(req),
    req.params.id as string,
    req.body.content,
  )
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Note added',
    data,
  })
})

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const data = await OrdersService.confirmCodPayment(scoped(req), req.params.id as string)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'COD payment confirmed',
    data,
  })
})

export const OrdersController = {
  list,
  getById,
  create,
  updateStatus,
  updateMetadata,
  remove,
  getCostBreakdown,
  addNote,
  confirmPayment,
}
