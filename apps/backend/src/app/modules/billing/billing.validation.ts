import { z } from 'zod'

const updatePlan = z.object({
  body: z.object({
    priceMonthly: z.number().nonnegative().optional(),
    maxUsers: z.number().int().positive().nullable().optional(),
    maxOrdersPerMonth: z.number().int().positive().nullable().optional(),
    maxProducts: z.number().int().positive().nullable().optional(),
    maxSkus: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
  }),
})

const updateSubscription = z.object({
  body: z.object({
    planId: z.string().optional(),
    status: z.enum(['trial', 'active', 'grace_period', 'expired', 'cancelled']).optional(),
    currentPeriodEnd: z.string().datetime().optional(),
    adminNotes: z.string().optional(),
  }),
})

const recordPayment = z.object({
  body: z.object({
    planId: z.string().min(1),
    amountPaid: z.number().positive(),
    paymentMethod: z.string().min(1),
    paymentRef: z.string().optional(),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    notes: z.string().optional(),
  }),
})

export const BillingValidation = { updatePlan, updateSubscription, recordPayment }
