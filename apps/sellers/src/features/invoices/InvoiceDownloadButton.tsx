'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import type { InvoiceData } from './InvoiceDocument'

const InvoiceDownloadButtonInner = dynamic(
  () => import('./InvoiceDownloadButtonInner').then((m) => m.InvoiceDownloadButtonInner),
  {
    ssr: false,
    loading: () => (
      <Button disabled size="sm" variant="outline">
        Loading PDF...
      </Button>
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
      <Button type="button" size="sm" onClick={() => window.print()}>
        ইনভয়েস প্রিন্ট করুন
      </Button>
    )
  }

  return <InvoiceDownloadButtonInner data={data} filename={filename} />
}
