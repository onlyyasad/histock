import { apiSlice } from '@/store/apiSlice'

export interface Courier {
  id: string
  name: string
}

export const financialsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCouriers: builder.query<Courier[], void>({
      query: () => '/couriers',
      providesTags: ['Courier'],
    }),
  }),
})

export const { useGetCouriersQuery } = financialsApi
