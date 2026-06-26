import { OrderStatus, PaymentMethod } from '@prisma/client'

export type IOrderFilters = {
  status?: OrderStatus
  courierId?: string
  paymentMethod?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type IOrderItemInput = {
  productId: string
  variantId: string | null
  quantity: number
  unitPrice: number
}

export type ICreateOrderInput = {
  customerId: string
  courierId: string | null
  paymentMethod: PaymentMethod
  deliveryFee: number
  notes?: string | null
  items: IOrderItemInput[]
}

export type IUpdateOrderMetadataInput = {
  courierId?: string | null
  notes?: string | null
  tags?: string[]
  linkedOrderId?: string | null
}

export type ITransitionParams = {
  orderId: string
  businessId: string
  toStatus: OrderStatus
  reason?: string
  userId: string
}

export type IOrderCapWarning = { type: 'ORDER_CAP_NEAR'; used: number; cap: number }
