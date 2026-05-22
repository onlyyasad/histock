'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { InvoiceData } from './InvoiceDocument'

// @react-pdf/renderer uses browser-only APIs — must be dynamic with ssr: false.
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span>Loading PDF...</span> },
)

const InvoiceDocumentDynamic = dynamic(
  () => import('./InvoiceDocument').then((m) => m.InvoiceDocument),
  { ssr: false },
)

const SAMPLE_DATA: InvoiceData = {
  orderNumber: 'ORD-000001',
  date: new Date().toLocaleDateString('en-GB'),
  customerName: 'Rahim Uddin',
  customerPhone: '01711234567',
  deliveryAddress: 'House 12, Road 4, Dhanmondi, Dhaka',
  items: [
    { name: 'Cotton Panjabi (M)', quantity: 2, unitPrice: 1500.0, totalPrice: 3000.0 },
    { name: 'Mens Belt', quantity: 1, unitPrice: 450.0, totalPrice: 450.0 },
  ],
  subtotal: 3450.0,
  deliveryFee: 70.0,
  total: 3520.0,
  sellerName: 'Demo Seller Shop',
}

export function InvoiceDownloadButton() {
  const [ready, setReady] = useState(false)

  return (
    <div>
      {!ready && (
        <button onClick={() => setReady(true)}>Generate Invoice PDF</button>
      )}
      {ready && (
        <PDFDownloadLink
          document={<InvoiceDocumentDynamic data={SAMPLE_DATA} />}
          fileName={`invoice-${SAMPLE_DATA.orderNumber}.pdf`}
        >
          {({ loading }) => (loading ? 'Building PDF...' : 'Download Invoice PDF')}
        </PDFDownloadLink>
      )}
    </div>
  )
}
