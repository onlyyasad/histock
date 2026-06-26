export type ICreateProductInput = {
  name: string
  sku?: string
  description?: string
  price: number
}

export type IUpdateProductInput = Partial<{
  name: string
  sku: string
  description: string
  price: number
  isActive: boolean
  isArchived: boolean
}>

export type ICreateVariantInput = {
  name: string
  sku?: string
  price: number
}

export type IProductCapWarning = { type: 'PRODUCT_CAP_NEAR'; used: number; cap: number }
export type ISkuCapWarning = { type: 'SKU_CAP_NEAR'; used: number; cap: number }
