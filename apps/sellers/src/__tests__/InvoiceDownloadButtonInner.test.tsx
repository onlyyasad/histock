import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { InvoiceDownloadButtonInner } from '@/features/invoices/InvoiceDownloadButtonInner'

// @react-pdf/renderer uses browser canvas APIs — mock entirely in jsdom
vi.mock('@react-pdf/renderer', () => ({
  PDFDownloadLink: ({
    children,
    fileName,
  }: {
    children: (props: { loading: boolean; error: Error | null; url: string | null; blob: Blob | null }) => React.ReactNode
    fileName: string
  }) => (
    <div data-testid="pdf-link" data-filename={fileName}>
      {children({ loading: false, error: null, url: 'mock-url', blob: null })}
    </div>
  ),
}))

// InvoiceDocument is a react-pdf Document — mock to null so react-pdf reconciler is never invoked
vi.mock('@/features/invoices/InvoiceDocument', () => ({
  InvoiceDocument: () => null,
}))

const testData = {
  orderNumber: 42,
  createdAt: '2026-06-05T14:30:00.000Z',
  sellerName: 'Test Seller',
  customerName: 'Customer A',
  customerPhone: '01700000000',
  items: [{ productNameSnapshot: 'Widget', quantity: 2, unitPrice: 100, totalPrice: 200 }],
  subtotal: 200,
  deliveryFee: 60,
  total: 260,
  paymentMethod: 'cod',
}

describe('InvoiceDownloadButtonInner', () => {
  it('renders the download button without crashing', () => {
    render(<InvoiceDownloadButtonInner data={testData} filename="invoice-ORD-000042.pdf" />)
    expect(screen.getByText('Download Invoice')).toBeInTheDocument()
  })

  it('passes the correct filename to PDFDownloadLink', () => {
    render(<InvoiceDownloadButtonInner data={testData} filename="invoice-ORD-000042.pdf" />)
    expect(screen.getByTestId('pdf-link')).toHaveAttribute('data-filename', 'invoice-ORD-000042.pdf')
  })
})
