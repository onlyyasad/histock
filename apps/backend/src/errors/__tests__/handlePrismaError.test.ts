import { Prisma } from '@prisma/client'
import handleClientError from '../handleClientError'
import handleValidationError from '../handleValidationError'

describe('handleClientError', () => {
  it('maps a P2002 unique violation to 409', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['email'] },
    })
    const simplified = handleClientError(err)
    expect(simplified.statusCode).toBe(409)
    expect(simplified.errorMessages[0].path).toBe('email')
  })

  it('maps a P2025 missing record to 404', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '6.0.0',
      meta: { cause: 'Record to update not found.' },
    })
    const simplified = handleClientError(err)
    expect(simplified.statusCode).toBe(404)
  })
})

describe('handleValidationError', () => {
  it('returns 400 carrying the prisma message', () => {
    const err = new Prisma.PrismaClientValidationError('Invalid arguments', {
      clientVersion: '6.0.0',
    })
    const simplified = handleValidationError(err)
    expect(simplified.statusCode).toBe(400)
    expect(simplified.errorMessages[0].message).toContain('Invalid arguments')
  })
})
