import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/axiosInstance', () => ({ axiosInstance: vi.fn() }))
import { axiosInstance } from '@/lib/axiosInstance'
import { axiosBaseQuery } from './axiosBaseQuery'

const mockedAxios = axiosInstance as unknown as ReturnType<typeof vi.fn>
const run = axiosBaseQuery()

describe('axiosBaseQuery unwrap', () => {
  beforeEach(() => vi.clearAllMocks())

  it('unwraps an enveloped response to its data', async () => {
    mockedAxios.mockResolvedValue({ data: { success: true, message: 'ok', data: { id: 1 } } })
    const res = await run('/x', undefined as never, {} as never)
    expect(res).toEqual({ data: { id: 1 } })
  })

  it('passes through a non-enveloped response unchanged', async () => {
    mockedAxios.mockResolvedValue({ data: [1, 2, 3] })
    const res = await run('/x', undefined as never, {} as never)
    expect(res).toEqual({ data: [1, 2, 3] })
  })

  it('surfaces errors with status and data', async () => {
    mockedAxios.mockRejectedValue({ response: { status: 404, data: { message: 'nope' } } })
    const res = await run('/x', undefined as never, {} as never)
    expect(res).toEqual({ error: { status: 404, data: { message: 'nope' } } })
  })
})
