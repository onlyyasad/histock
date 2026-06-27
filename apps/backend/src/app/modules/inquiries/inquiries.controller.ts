import { Request, Response } from 'express'
import httpStatus from 'http-status'
import type { InquiryStatus } from '@prisma/client'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { InquiriesService } from './inquiries.service'

const list = catchAsync(async (req: Request, res: Response) => {
  const data = await InquiriesService.list(req.query.status as InquiryStatus | undefined)
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Inquiries retrieved', data })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await InquiriesService.getById(req.params.id as string)
  if (!data) throw new ApiError(httpStatus.NOT_FOUND, 'Inquiry not found')
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Inquiry retrieved', data })
})

const update = catchAsync(async (req: Request, res: Response) => {
  const { action, content } = req.body as { action: 'reply' | 'resolve'; content?: string }
  if (action === 'reply') {
    if (!content) throw new ApiError(httpStatus.BAD_REQUEST, 'content required for reply')
    const data = await InquiriesService.reply(req.params.id as string, content)
    return sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Reply sent', data })
  }
  const data = await InquiriesService.resolve(req.params.id as string)
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Inquiry resolved', data })
})

// Raw SSE — NOT enveloped (matches seller schedules SSE exemption).
const stream = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let closed = false
  const heartbeat = setInterval(() => {
    if (!closed) res.write('event: heartbeat\ndata: {}\n\n')
  }, 15_000)
  const staleTimer = setTimeout(() => {
    closed = true
    res.write('event: close\ndata: {"reason":"stale"}\n\n')
    cleanup()
    res.end()
  }, 30_000)

  function cleanup() {
    closed = true
    clearInterval(heartbeat)
    clearTimeout(staleTimer)
  }

  req.on('close', cleanup)
  res.on('error', cleanup)

  InquiriesService.getById(req.params.id as string)
    .then((inquiry) => {
      if (inquiry && !closed) res.write(`event: init\ndata: ${JSON.stringify(inquiry)}\n\n`)
    })
    .catch(() => {})
}

export const InquiriesController = { list, getById, update, stream }
