import { apiSlice } from '@/core/store/apiSlice'
import type { OrderResponse, CreateOrderInput } from '@histock/shared'

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<
      OrderResponse[],
      { status?: string; courierId?: string; paymentMethod?: string; from?: string; to?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: '/orders', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), 'Order']
          : ['Order'],
    }),

    getOrder: builder.query<OrderResponse, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),

    createOrder: builder.mutation<OrderResponse, CreateOrderInput>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Dashboard', 'Customer'],
    }),

    updateOrderStatus: builder.mutation<{ ok: boolean }, { id: string; status: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Order', id }, 'Dashboard'],
    }),

    updateOrderMetadata: builder.mutation<
      OrderResponse,
      { id: string; courierId?: string | null; notes?: string | null; tags?: string[] }
    >({
      query: ({ id, ...body }) => ({ url: `/orders/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Order', id }],
    }),

    confirmCodPayment: builder.mutation<OrderResponse, string>({
      query: (id) => ({ url: `/orders/${id}/payment`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),

    deleteOrder: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Order', 'Dashboard'],
    }),

    getOrderCostBreakdown: builder.query<
      {
        totalRevenue: number
        totalCost: number
        profit: number
        margin: number
        allocations: Array<{ productName: string; quantity: number; costPerUnit: number; totalCost: number }>
        note: string | null
      },
      string
    >({
      query: (id) => `/orders/${id}/cost-breakdown`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),

    addOrderNote: builder.mutation<
      { id: string; content: string; createdAt: string; user: { id: string; name: string } },
      { orderId: string; content: string }
    >({
      query: ({ orderId, content }) => ({ url: `/orders/${orderId}/notes`, method: 'POST', body: { content } }),
      invalidatesTags: (_result, _error, { orderId }) => [{ type: 'Order', id: orderId }],
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderMetadataMutation,
  useConfirmCodPaymentMutation,
  useDeleteOrderMutation,
  useGetOrderCostBreakdownQuery,
  useAddOrderNoteMutation,
} = ordersApi
