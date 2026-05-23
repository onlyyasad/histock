import { apiSlice } from '@/store/apiSlice'

export interface PnlData {
  from: string
  to: string
  revenue: number
  cost: number
  profit: number
  margin: number
  statusBreakdown: Array<{ status: string; count: number; total: number }>
}

export interface RemittanceBatch {
  id: string
  courierId: string
  batchName: string
  totalCodAmount: number
  totalOrders: number
  status: string
  createdAt: string
  courier: { id: string; name: string }
  _count: { orders: number }
}

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPnl: builder.query<PnlData, { from: string; to: string }>({
      query: (params) => ({ url: '/analytics/profit-loss', params }),
      providesTags: ['Analytics'],
    }),

    getRemittances: builder.query<RemittanceBatch[], void>({
      query: () => '/remittances',
      providesTags: ['Remittance'],
    }),

    createRemittance: builder.mutation<
      RemittanceBatch,
      { courierId: string; batchName: string; orderIds: string[] }
    >({
      query: (body) => ({ url: '/remittances', method: 'POST', body }),
      invalidatesTags: ['Remittance'],
    }),
  }),
})

export const {
  useGetPnlQuery,
  useGetRemittancesQuery,
  useCreateRemittanceMutation,
} = analyticsApi
