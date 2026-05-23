import { apiSlice } from '@/store/apiSlice'

export type PermissionMap = Record<string, Record<string, boolean>>

export const permissionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<PermissionMap, void>({
      query: () => '/settings/permissions',
      providesTags: ['Permission'],
    }),

    updatePermission: builder.mutation<
      { ok: boolean },
      { role: 'manager' | 'staff'; permission: string; granted: boolean }
    >({
      query: (body) => ({ url: '/settings/permissions', method: 'PATCH', body }),
      invalidatesTags: ['Permission'],
    }),
  }),
})

export const { useGetPermissionsQuery, useUpdatePermissionMutation } = permissionsApi
