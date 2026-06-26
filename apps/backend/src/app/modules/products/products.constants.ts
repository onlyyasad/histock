import { Prisma } from '@prisma/client'

// Variant fields surfaced in product list/detail views.
export const productVariantSelect = {
  id: true,
  name: true,
  price: true,
  currentStock: true,
  isActive: true,
} satisfies Prisma.ProductVariantSelect

// Cost-entry (lot) fields surfaced in product detail.
export const productCostEntrySelect = {
  id: true,
  entryDate: true,
  lotQuantity: true,
  remainingQty: true,
  totalCost: true,
  costPerUnit: true,
  idempotencyKey: true,
  createdAt: true,
} satisfies Prisma.ProductCostEntrySelect

// Caps warn at 80% of the plan limit before hard-blocking at the limit.
export const CAP_WARNING_THRESHOLD = 0.8
