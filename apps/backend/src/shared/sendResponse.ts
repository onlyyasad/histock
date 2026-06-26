import { Response } from 'express'

type IMeta = {
  page: number
  limit: number
  total: number
}

type IApiResponse<T> = {
  statusCode: number
  success: boolean
  message: string
  meta?: IMeta
  data: T
}

const sendResponse = <T>(res: Response, payload: IApiResponse<T>): void => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    ...(payload.meta ? { meta: payload.meta } : {}),
    data: payload.data,
  })
}

export default sendResponse
