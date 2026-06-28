import type { SubscriptionStatus } from '@prisma/client'

export type IUpdateSubscriptionInput = {
  planId?: string
  status?: SubscriptionStatus
  currentPeriodEnd?: string
  adminNotes?: string
}

export type IUpdatePlanInput = {
  priceMonthly?: number
  maxUsers?: number | null
  maxOrdersPerMonth?: number | null
  maxProducts?: number | null
  maxSkus?: number | null
  isActive?: boolean
  displayOrder?: number
}

export type IRecordPaymentInput = {
  planId: string
  amountPaid: number
  paymentMethod: string
  paymentRef?: string
  periodStart: string
  periodEnd: string
  notes?: string
}
