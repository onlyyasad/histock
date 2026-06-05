'use client'

import dynamic from 'next/dynamic'
import type { InvoiceData } from './InvoiceDocument'

const InvoiceDownloadButtonInner = dynamic(
  () => import('./InvoiceDownloadButtonInner').then((m) => m.InvoiceDownloadButtonInner),
  {
    ssr: false,
    loading: () => (
      <button disabled className="border rounded px-4 py-2 text-sm opacity-50">
        Loading PDF...
      </button>
    ),
  },
)

interface Props {
  data: InvoiceData
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

  return <InvoiceDownloadButtonInner data={data} filename={filename} />
}
