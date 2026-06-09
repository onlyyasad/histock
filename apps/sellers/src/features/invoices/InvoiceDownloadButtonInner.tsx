import { PDFDownloadLink } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => window.print()}
            >
              Print Invoice
            </Button>
          )
        }
        return (
          <Button type="button" size="sm" disabled={loading}>
            {loading ? 'Generating PDF...' : 'Download Invoice'}
          </Button>
        )
      }}
    </PDFDownloadLink>
  )
}
