export type ICreateRemittanceInput = {
  courierId: string
  batchName: string
  orderIds: string[]
}

export type IImportOrderRow = {
  orderId: string
  codAmount: number
}

export type IImportRemittanceInput = {
  courierId: string
  batchName: string
  fileName: string
  orders: IImportOrderRow[]
  unmatchedCount: number
}
