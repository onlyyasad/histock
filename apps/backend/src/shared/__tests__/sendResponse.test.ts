import { Response } from 'express'
import sendResponse from '../sendResponse'

function mockRes(): Response {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response
}

describe('sendResponse', () => {
  it('wraps data in the success envelope without meta', () => {
    const res = mockRes()
    sendResponse(res, { statusCode: 200, success: true, message: 'ok', data: { id: 1 } })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'ok', data: { id: 1 } })
  })

  it('includes meta when provided', () => {
    const res = mockRes()
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'ok',
      meta: { page: 1, limit: 10, total: 2 },
      data: [],
    })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'ok',
      meta: { page: 1, limit: 10, total: 2 },
      data: [],
    })
  })
})
