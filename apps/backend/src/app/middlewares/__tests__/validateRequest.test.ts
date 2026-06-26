import { z } from 'zod'
import { Request, Response } from 'express'
import validateRequest from '../validateRequest'

const schema = z.object({ body: z.object({ name: z.string() }) })

describe('validateRequest', () => {
  it('calls next() with no argument when input is valid', async () => {
    const next = jest.fn()
    const req = { body: { name: 'a' }, query: {}, params: {} } as unknown as Request
    await validateRequest(schema)(req, {} as Response, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('calls next(error) when input is invalid', async () => {
    const next = jest.fn()
    const req = { body: {}, query: {}, params: {} } as unknown as Request
    await validateRequest(schema)(req, {} as Response, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0][0]).toBeDefined()
  })

  it('writes parsed defaults back onto req.body', async () => {
    const withDefault = z.object({ body: z.object({ label: z.string().default('Home') }) })
    const next = jest.fn()
    const req = { body: {}, query: {}, params: {} } as unknown as Request
    await validateRequest(withDefault)(req, {} as Response, next)
    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ label: 'Home' })
  })
})
