import { describe, it, expect } from 'vitest'
import { getErrorMessage, getErrorCode } from './apiError'

describe('getErrorMessage', () => {
  it('reads the new envelope `message`', () => {
    const err = { status: 409, data: { success: false, message: 'Email already in use' } }
    expect(getErrorMessage(err)).toBe('Email already in use')
  })

  it('falls back to the legacy `error` field', () => {
    const err = { status: 400, data: { error: 'old style' } }
    expect(getErrorMessage(err)).toBe('old style')
  })

  it('treats a string data body as the message', () => {
    const err = { status: 500, data: 'Network Error' }
    expect(getErrorMessage(err)).toBe('Network Error')
  })

  it('returns the fallback when nothing usable is present', () => {
    expect(getErrorMessage(undefined)).toBe('Something went wrong')
    expect(getErrorMessage({ status: 500 }, 'Custom')).toBe('Custom')
  })
})

describe('getErrorCode', () => {
  it('reads the top-level machine code', () => {
    const err = { status: 402, data: { success: false, message: 'cap', code: 'ORDER_CAP_REACHED' } }
    expect(getErrorCode(err)).toBe('ORDER_CAP_REACHED')
  })

  it('returns undefined when no code is present', () => {
    expect(getErrorCode({ status: 404, data: { message: 'nope' } })).toBeUndefined()
    expect(getErrorCode(undefined)).toBeUndefined()
  })
})
