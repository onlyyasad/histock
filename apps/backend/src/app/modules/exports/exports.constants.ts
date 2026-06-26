// CSV column definitions (order preserved from the original handlers).
export const ordersExportColumns = [
  { key: 'order_number', header: 'Order Number' },
  { key: 'created_at', header: 'Date' },
  { key: 'customer_name', header: 'Customer' },
  { key: 'customer_phone', header: 'Phone' },
  { key: 'courier', header: 'Courier' },
  { key: 'status', header: 'Status' },
  { key: 'payment_method', header: 'Payment' },
  { key: 'total', header: 'Total (BDT)' },
  { key: 'delivery_fee', header: 'Delivery Fee (BDT)' },
]

export const customersExportColumns = [
  { key: 'name', header: 'Name' },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email' },
  { key: 'total_orders', header: 'Total Orders' },
  { key: 'total_spent', header: 'Total Spent (BDT)' },
  { key: 'is_flagged', header: 'Flagged' },
  { key: 'flag_reason', header: 'Flag Reason' },
  { key: 'joined', header: 'Joined' },
]

export const productsExportColumns = [
  { key: 'name', header: 'Product Name' },
  { key: 'sku', header: 'SKU' },
  { key: 'price', header: 'Price (BDT)' },
  { key: 'current_stock', header: 'Stock' },
  { key: 'description', header: 'Description' },
  { key: 'created_at', header: 'Created' },
]
