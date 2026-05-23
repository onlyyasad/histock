import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Phase 1: English only. Bangla font (Hind Siliguri) is Phase 3.

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 11, padding: '40px 50px', color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  bold: { fontFamily: 'Helvetica-Bold' },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  col: { flex: 1 },
  colRight: { width: 80, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, gap: 16 },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    color: '#9CA3AF',
    fontSize: 9,
    textAlign: 'center',
  },
})

export interface InvoiceData {
  orderNumber: number
  createdAt: string
  sellerName: string
  customerName: string
  customerPhone: string
  items: Array<{
    productNameSnapshot: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
}

function fmt(amount: number): string {
  return `BDT ${Number(amount).toFixed(2)}`
}

function orderNum(n: number): string {
  return `ORD-${String(n).padStart(6, '0')}`
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document title={`Invoice ${orderNum(data.orderNumber)}`} author={data.sellerName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={{ ...styles.bold, fontSize: 18 }}>{data.sellerName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...styles.bold, fontSize: 22, color: '#374151' }}>INVOICE</Text>
            <Text style={{ color: '#6B7280', marginTop: 4 }}>{orderNum(data.orderNumber)}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 10 }}>
              {new Date(data.createdAt).toLocaleDateString('en-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.bold}>{data.customerName}</Text>
          <Text style={{ color: '#6B7280' }}>{data.customerPhone}</Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <View style={{ ...styles.itemRow, backgroundColor: '#F9FAFB' }}>
            <Text style={{ ...styles.col, ...styles.bold, fontSize: 9, textTransform: 'uppercase' }}>Item</Text>
            <Text style={{ width: 50, textAlign: 'center', ...styles.bold, fontSize: 9, textTransform: 'uppercase' }}>Qty</Text>
            <Text style={{ ...styles.colRight, ...styles.bold, fontSize: 9, textTransform: 'uppercase' }}>Unit</Text>
            <Text style={{ ...styles.colRight, ...styles.bold, fontSize: 9, textTransform: 'uppercase' }}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.col}>{item.productNameSnapshot}</Text>
              <Text style={{ width: 50, textAlign: 'center' }}>{item.quantity}</Text>
              <Text style={styles.colRight}>{fmt(item.unitPrice)}</Text>
              <Text style={styles.colRight}>{fmt(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View>
          <View style={styles.totalRow}>
            <Text style={{ color: '#6B7280', width: 80, textAlign: 'right' }}>Subtotal</Text>
            <Text style={{ ...styles.bold, width: 80, textAlign: 'right' }}>{fmt(data.subtotal)}</Text>
          </View>
          {data.deliveryFee > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#6B7280', width: 80, textAlign: 'right' }}>Delivery</Text>
              <Text style={{ ...styles.bold, width: 80, textAlign: 'right' }}>{fmt(data.deliveryFee)}</Text>
            </View>
          )}
          <View style={{ ...styles.totalRow, marginTop: 10 }}>
            <Text style={{ ...styles.bold, fontSize: 13, width: 80, textAlign: 'right', color: '#111827' }}>Total</Text>
            <Text style={{ ...styles.bold, fontSize: 14, width: 80, textAlign: 'right' }}>{fmt(data.total)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text>{data.paymentMethod.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>

        <Text style={styles.footer}>
          Thank you for your order. For any questions, please contact us directly.
        </Text>
      </Page>
    </Document>
  )
}
