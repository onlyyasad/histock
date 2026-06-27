import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the axios instance the base query depends on.
vi.mock('@/lib/axiosInstance', () => ({
  axiosInstance: vi.fn(),
}))

import { axiosInstance } from '@/lib/axiosInstance'
import { axiosBaseQuery } from './axiosBaseQuery'

const mockAxios = axiosInstance as unknown as ReturnType<typeof vi.fn>
const bq = axiosBaseQuery()
// RTK Query calls baseQuery(args, api, extraOptions); our impl only uses args.
const run = (args: string) => bq(args, {} as never, {} as never)

beforeEach(() => {
  mockAxios.mockReset()
})

describe('axiosBaseQuery', () => {
  it('unwraps the success envelope to its data', async () => {
    mockAxios.mockResolvedValue({ data: { success: true, message: 'ok', data: [{ id: 1 }] } })
    const result = await run('/customers')
    expect(result).toEqual({ data: [{ id: 1 }] })
  })

  it('passes through a non-enveloped body unchanged', async () => {
    mockAxios.mockResolvedValue({ data: [{ id: 1 }] })
    const result = await run('/legacy')
    expect(result).toEqual({ data: [{ id: 1 }] })
  })

  it('returns null data when the envelope data is null', async () => {
    mockAxios.mockResolvedValue({ data: { success: true, message: 'Logged out', data: null } })
    const result = await run('/auth/logout')
    expect(result).toEqual({ data: null })
  })

  it('surfaces the error envelope as { status, data }', async () => {
    mockAxios.mockRejectedValue({
      response: { status: 409, data: { success: false, message: 'Email already in use' } },
    })
    const result = await run('/auth/register')
    expect(result).toEqual({
      error: { status: 409, data: { success: false, message: 'Email already in use' } },
    })
  })
})
