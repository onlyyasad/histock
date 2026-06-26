export type ICustomerFilters = {
  search?: string
}

export type ICreateCustomerInput = {
  name: string
  phone: string
  email?: string | null
}

export type IUpdateCustomerInput = Partial<ICreateCustomerInput>

export type ICreateAddressInput = {
  label: string
  addressLine: string
  district?: string
  division?: string
  isDefault: boolean
}

export type IUpdateAddressInput = Partial<ICreateAddressInput>
