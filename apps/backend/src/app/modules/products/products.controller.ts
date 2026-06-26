import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { prismaWithScope } from '../../../prisma/client'
import { ProductsService } from './products.service'

const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId

// GET /products — list joined with avg margin % derived from delivered orders.
const list = catchAsync(async (req: Request, res: Response) => {
  const bId = businessIdOf(req)
  const [products, margins] = await Promise.all([
    ProductsService.listProducts(scoped(req)),
    ProductsService.listProductMargins(bId),
  ])

  const marginMap = new Map(
    margins.map((m) => {
      const revenue = Number(m.revenue)
      const cogs = Number(m.cogs)
      const margin =
        revenue > 0 ? Math.round(((revenue - cogs) / revenue) * 10000) / 100 : null
      return [m.product_id, margin]
    }),
  )

  const data = products.map((p) => ({ ...p, avgMarginPct: marginMap.get(p.id) ?? null }))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved',
    data,
  })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await ProductsService.getById(scoped(req), req.params.id as string)
  if (!data) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found')
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved',
    data,
  })
})

const create = catchAsync(async (req: Request, res: Response) => {
  const { product, warning } = await ProductsService.createProduct(
    scoped(req),
    businessIdOf(req),
    req.body,
  )
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product created',
    data: { ...product, warning: warning ?? null },
  })
})

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await ProductsService.updateProduct(scoped(req), req.params.id as string, req.body)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated',
    data,
  })
})

const remove = catchAsync(async (req: Request, res: Response) => {
  await ProductsService.softDeleteProduct(scoped(req), req.params.id as string)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product deleted',
    data: null,
  })
})

const createVariant = catchAsync(async (req: Request, res: Response) => {
  const { variant, warning } = await ProductsService.createVariant(
    scoped(req),
    businessIdOf(req),
    req.params.id as string,
    req.body,
  )
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Variant created',
    data: { ...variant, warning: warning ?? null },
  })
})

const createCostEntry = catchAsync(async (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined
  if (!idempotencyKey) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'X-Idempotency-Key header required')
  }
  const { entry, created } = await ProductsService.createCostEntry(
    businessIdOf(req),
    req.params.id as string,
    { ...req.body, idempotencyKey },
  )
  sendResponse(res, {
    statusCode: created ? httpStatus.CREATED : httpStatus.OK,
    success: true,
    message: created ? 'Cost entry created' : 'Cost entry already recorded',
    data: entry,
  })
})

export const ProductsController = {
  list,
  getById,
  create,
  update,
  remove,
  createVariant,
  createCostEntry,
}
