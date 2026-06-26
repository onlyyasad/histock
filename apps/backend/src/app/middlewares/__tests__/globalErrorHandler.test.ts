import { Request, Response } from 'express'
import globalErrorHandler from '../globalErrorHandler'
import ApiError from '../../../errors/ApiError'

function mockRes(): Response {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response
}

describe('globalErrorHandler', () => {
  it('formats an ApiError into the standard error envelope', () => {
    const res = mockRes()
    globalErrorHandler(new ApiError(403, 'Forbidden'), {} as Request, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Forbidden' }),
    )
  })

  it('falls back to 500 for an unknown error', () => {
    const res = mockRes()
    globalErrorHandler(new Error('boom'), {} as Request, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('includes the ApiError code when present', () => {
    const res = mockRes()
    globalErrorHandler(
      new ApiError(402, 'Cap reached', { code: 'PRODUCT_CAP_REACHED' }),
      {} as Request,
      res,
      jest.fn(),
    )
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PRODUCT_CAP_REACHED' }),
    )
  })
})
