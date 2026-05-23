export type UserRole = 'owner' | 'manager' | 'staff' | 'platform_admin'

export type SellerSession = {
  userId: string
  role: 'owner' | 'manager' | 'staff'
  businessId: string
  userEmail: string
}

export type AdminSession = {
  userId: string
  role: 'platform_admin'
  businessId: null
  userEmail: string
}

export type AppSession = SellerSession | AdminSession

export const isSellerSession = (s: AppSession): s is SellerSession =>
  s.role !== 'platform_admin'

export const isAdminSession = (s: AppSession): s is AdminSession =>
  s.role === 'platform_admin'
