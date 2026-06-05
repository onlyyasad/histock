import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoiceDocument, type InvoiceData } from './InvoiceDocument'

interface Props {
  data: InvoiceData
  filename: string
}

export function InvoiceDownloadButtonInner({ data, filename }: Props) {
  return (
    <PDFDownloadLink document={<InvoiceDocument data={data} />} fileName={filename}>
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
  )
}
