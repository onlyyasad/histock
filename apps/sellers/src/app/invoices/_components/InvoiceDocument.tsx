'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
})

export interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface InvoiceData {
  orderNumber: string
  date: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  items: InvoiceItem[]
  subtotal: number
  deliveryFee: number
  total: number
  sellerName: string
}

// All monetary values are DECIMAL(12,2) — stored and displayed as e.g. 1234.50.
function formatMoney(amount: number): string {
  return `৳${amount.toFixed(2)}`
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.header}>{data.sellerName}</Text>
          <Text style={styles.bold}>INVOICE</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Order Number:</Text>
            <Text>{data.orderNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text>Date:</Text>
            <Text>{data.date}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.bold}>Customer</Text>
          <Text>{data.customerName}</Text>
          <Text>{data.customerPhone}</Text>
          <Text>{data.deliveryAddress}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.bold}>Items</Text>
          {data.items.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text>
                {item.name} x{item.quantity}
              </Text>
              <Text>{formatMoney(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>{formatMoney(data.subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Delivery Fee</Text>
            <Text>{formatMoney(data.deliveryFee)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Total</Text>
            <Text style={styles.bold}>{formatMoney(data.total)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
