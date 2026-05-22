import { apiSlice } from '@/store/apiSlice'
import type { ProductResponse } from '@histock/shared'

export interface CostEntry {
  id: string
  entryDate: string
  lotQuantity: number
  remainingQty: number
  totalCost: number
  costPerUnit: number
  idempotencyKey: string
  createdAt: string
}

export type ProductWithCosts = ProductResponse & { costEntries: CostEntry[] }

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductResponse[], { search?: string; lowStock?: boolean }>({
      query: (params) => ({ url: '/products', params }),
      providesTags: ['Product'],
    }),

    getProduct: builder.query<ProductWithCosts, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    createProduct: builder.mutation<
      ProductResponse,
      { name: string; sku?: string; description?: string; price: number }
    >({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),

    updateProduct: builder.mutation<
      ProductResponse,
      { id: string; name?: string; sku?: string; description?: string; price?: number }
    >({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, 'Product'],
    }),

    logPurchase: builder.mutation<
      CostEntry,
      {
        productId: string
        idempotencyKey: string
        entryDate: string
        lotQuantity: number
        totalCost: number
      }
    >({
      query: ({ productId, idempotencyKey, ...body }) => ({
        url: `/products/${productId}/cost-entries`,
        method: 'POST',
        body,
        headers: { 'X-Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'Product', id: productId },
        'Product',
      ],
    }),

    deleteProduct: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useLogPurchaseMutation,
  useDeleteProductMutation,
} = productsApi
