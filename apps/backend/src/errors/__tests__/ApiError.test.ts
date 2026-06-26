import ApiError from '../ApiError'

describe('ApiError', () => {
  it('is an Error carrying a statusCode and message', () => {
    const err = new ApiError(404, 'Not found')
    expect(err).toBeInstanceOf(Error)
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Not found')
  })

  it('carries an optional machine-readable code', () => {
    const err = new ApiError(402, 'Cap reached', { code: 'PRODUCT_CAP_REACHED' })
    expect(err.code).toBe('PRODUCT_CAP_REACHED')
  })
})
