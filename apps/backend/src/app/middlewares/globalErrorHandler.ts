import { ErrorRequestHandler } from 'express'
import httpStatus from 'http-status'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import config from '../../config'
import ApiError from '../../errors/ApiError'
import handleZodError from '../../errors/handleZodError'
import handleClientError from '../../errors/handleClientError'
import handleValidationError from '../../errors/handleValidationError'
import { IGenericErrorMessage } from '../../interfaces/error'

const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR
  let message = 'Something went wrong'
  let code: string | undefined
  let errorMessages: IGenericErrorMessage[] = []

  if (error instanceof ZodError) {
    const simplified = handleZodError(error)
    statusCode = simplified.statusCode
    message = simplified.message
    errorMessages = simplified.errorMessages
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    const simplified = handleValidationError(error)
    statusCode = simplified.statusCode
    message = simplified.message
    errorMessages = simplified.errorMessages
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplified = handleClientError(error)
    statusCode = simplified.statusCode
    message = simplified.message
    errorMessages = simplified.errorMessages
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
    errorMessages = error.message ? [{ path: '', message: error.message }] : []
  } else if (error instanceof Error) {
    message = error.message
    errorMessages = error.message ? [{ path: '', message: error.message }] : []
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(code ? { code } : {}),
    errorMessages,
    stack: config.env !== 'production' ? (error as Error)?.stack : undefined,
  })
}

export default globalErrorHandler
