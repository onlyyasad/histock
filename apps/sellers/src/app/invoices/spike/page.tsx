import { InvoiceDownloadButton } from '../_components/InvoiceDownloadButton'

export default function InvoiceSpikePage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Invoice PDF Spike</h1>
      <p>
        Click the button below. A PDF should download with English text and correct amounts.
      </p>
      <InvoiceDownloadButton />
    </main>
  )
}
