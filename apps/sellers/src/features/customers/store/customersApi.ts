import { apiSlice } from '@/store/apiSlice'

export interface CustomerAddress {
  id: string
  label: string
  addressLine: string
  district: string | null
  division: string | null
  isDefault: boolean
}

export interface CustomerSummary {
  id: string
  name: string
  phone: string
  email: string | null
  totalOrders: number
  totalSpent: number
  isFlagged: boolean
  flagReason: string | null
  createdAt: string
}

export interface CustomerDetail extends CustomerSummary {
  addresses: CustomerAddress[]
  orders: Array<{
    id: string
    orderNumber: number
    status: string
    total: number
    createdAt: string
  }>
}

export const customersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<CustomerSummary[], { search?: string; page?: number }>({
      query: (params) => ({ url: '/customers', params }),
      providesTags: ['Customer'],
    }),

    getCustomer: builder.query<CustomerDetail, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),

    createCustomer: builder.mutation<
      CustomerDetail,
      { name: string; phone: string; email?: string }
    >({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: ['Customer'],
    }),

    updateCustomer: builder.mutation<
      CustomerDetail,
      { id: string; name?: string; phone?: string; email?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Customer', id }, 'Customer'],
    }),

    deleteCustomer: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),

    addAddress: builder.mutation<
      CustomerAddress,
      { customerId: string; label: string; addressLine: string; district?: string; isDefault: boolean }
    >({
      query: ({ customerId, ...body }) => ({
        url: `/customers/${customerId}/addresses`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [{ type: 'Customer', id: customerId }],
    }),

    updateAddress: builder.mutation<
      CustomerAddress,
      {
        customerId: string
        addressId: string
        label?: string
        addressLine?: string
        district?: string | null
        division?: string | null
        isDefault?: boolean
      }
    >({
      query: ({ customerId, addressId, ...body }) => ({
        url: `/customers/${customerId}/addresses/${addressId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Customer', id: customerId },
      ],
    }),

    deleteAddress: builder.mutation<
      { ok: boolean },
      { customerId: string; addressId: string }
    >({
      query: ({ customerId, addressId }) => ({
        url: `/customers/${customerId}/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Customer', id: customerId },
      ],
    }),

    flagCustomer: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/customers/${id}/flag`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Customer', id }, 'Customer'],
    }),

    unflagCustomer: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/customers/${id}/flag`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Customer', id }, 'Customer'],
    }),

    lookupCustomer: builder.query<CustomerSummary | null, string>({
      query: (phone) => ({ url: '/customers/lookup', params: { phone } }),
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useFlagCustomerMutation,
  useUnflagCustomerMutation,
  useLazyLookupCustomerQuery,
} = customersApi
