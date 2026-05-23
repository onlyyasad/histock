export const DEMO_OWNER = {
  email: 'owner@demo.histock.app',
  password: 'Demo@123',
  name: 'Demo Owner',
  role: 'owner' as const,
}

export const DEMO_MANAGER = {
  email: 'manager@demo.histock.app',
  password: 'Demo@123',
  name: 'Demo Manager',
  role: 'manager' as const,
}

export const DEMO_STAFF = {
  email: 'staff@demo.histock.app',
  password: 'Demo@123',
  name: 'Demo Staff',
  role: 'staff' as const,
}

export const DEMO_BUSINESS_SLUG = 'demo-business'

// All monetary values as DECIMAL(12,2) — stored as e.g. 1800.00
export const DEMO_PRODUCTS = [
  { name: 'Polo Shirt - White', sku: 'POLO-WHT', lotQuantity: 120, totalCost: 1800.0, price: 350.0 },
  { name: 'Polo Shirt - Black', sku: 'POLO-BLK', lotQuantity: 80,  totalCost: 1800.0, price: 350.0 },
  { name: 'Denim Jeans',        sku: 'DENIM-001', lotQuantity: 60,  totalCost: 4500.0, price: 950.0 },
  { name: 'Cotton Salwar',      sku: 'SLW-001',   lotQuantity: 100, totalCost: 2200.0, price: 450.0 },
  { name: 'Kurti Set',          sku: 'KUR-001',   lotQuantity: 50,  totalCost: 3500.0, price: 750.0 },
]

export const DEMO_CUSTOMER_NAMES = [
  'Fatima Rahman', 'Rahim Uddin', 'Nusrat Jahan', 'Kamal Hossain', 'Dilruba Akter',
  'Shahidul Islam', 'Morshed Ali', 'Roksana Begum', 'Jahangir Khan', 'Sharmin Sultana',
]

export const DEMO_COURIER_NAMES = ['Pathao', 'REDX', 'eCourier']
