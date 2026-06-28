import { describe, it, expect } from 'vitest'
import { getErrorMessage, getErrorCode } from './apiError'

describe('getErrorMessage', () => {
  it('reads data.message first', () => {
    expect(getErrorMessage({ data: { message: 'boom' } })).toBe('boom')
  })
  it('falls back to data.error', () => {
    expect(getErrorMessage({ data: { error: 'legacy' } })).toBe('legacy')
  })
  it('uses the fallback when nothing matches', () => {
    expect(getErrorMessage({ data: {} }, 'nope')).toBe('nope')
  })
  it('tolerates string data', () => {
    expect(getErrorMessage({ data: 'raw' })).toBe('raw')
  })
})

describe('getErrorCode', () => {
  it('reads data.code', () => {
    expect(getErrorCode({ data: { code: 'X' } })).toBe('X')
  })
  it('returns undefined for string data', () => {
    expect(getErrorCode({ data: 'raw' })).toBeUndefined()
  })
})
