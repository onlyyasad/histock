'use client'

import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../api/axiosBaseQuery'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'Auth', 'Order', 'Customer', 'Product', 'Dashboard', 'Analytics',
    'Remittance', 'Team', 'Schedule', 'Permission', 'Ticket',
    'Courier', 'AiUsage',
  ],
  endpoints: () => ({}),
})
