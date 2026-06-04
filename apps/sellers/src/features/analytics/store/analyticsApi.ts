import { apiSlice } from '@/store/apiSlice'

export interface PnlData {
  from: string
  to: string
  revenue: number
  cogs: number
  deliveryFees: number
  refunds: number
  profit: number
  margin: number
  orderCount: number
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
}

export interface RemittanceImportInput {
  courierId: string
  batchName: string
  fileName: string
  orders: Array<{ orderId: string; codAmount: number }>
  unmatchedCount: number
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

    createRemittanceImport: builder.mutation<RemittanceBatch, RemittanceImportInput>({
      query: (body) => ({ url: '/remittances/import', method: 'POST', body }),
      invalidatesTags: ['Remittance'],
    }),
  }),
})

export const {
  useGetPnlQuery,
  useGetRemittancesQuery,
  useCreateRemittanceImportMutation,
} = analyticsApi
