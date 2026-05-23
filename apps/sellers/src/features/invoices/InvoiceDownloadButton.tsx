'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { InvoiceData } from './InvoiceDocument'

// @react-pdf/renderer uses browser-only APIs — must be dynamic with ssr: false.
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((m) => m.PDFDownloadLink),
  { ssr: false },
)

const InvoiceDocumentDynamic = dynamic(
  () => import('./InvoiceDocument').then((m) => m.InvoiceDocument),
  { ssr: false },
)

interface Props {
  data: InvoiceData
  // When locale is 'bn', react-pdf cannot shape Bangla text correctly (no HarfBuzz).
  // Fallback: window.print() lets the browser OS renderer handle shaping.
  locale?: 'en' | 'bn'
}

export function InvoiceDownloadButton({ data, locale = 'en' }: Props) {
  const filename = `invoice-ORD-${String(data.orderNumber).padStart(6, '0')}.pdf`

  if (locale === 'bn') {
    return (
      <button
        type="button"
        onClick={() => window.print()}
        className="bg-gray-800 text-white rounded px-4 py-2 text-sm"
      >
        ইনভয়েস প্রিন্ট করুন
      </button>
    )
  }

  return (
    <Suspense
      fallback={
        <button disabled className="border rounded px-4 py-2 text-sm opacity-50">
          Loading PDF...
        </button>
      }
    >
      <PDFDownloadLink document={<InvoiceDocumentDynamic data={data} />} fileName={filename}>
        {({ loading, error }) => {
          if (error) {
            return (
              <button
                type="button"
                onClick={() => window.print()}
                className="border rounded px-4 py-2 text-sm text-red-600"
              >
                Print Invoice
              </button>
            )
          }
          return (
            <button
              type="button"
              disabled={loading}
              className="bg-gray-800 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Generating PDF...' : 'Download Invoice'}
            </button>
          )
        }}
      </PDFDownloadLink>
    </Suspense>
  )
}
