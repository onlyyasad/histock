'use client'

// CSS-only print fallback. Hidden by default (print:block via Tailwind).
// Triggers browser print dialog when window.print() is called.
// When locale='bn', the browser OS renderer handles Bangla shaping — react-pdf cannot.

import type { InvoiceData } from './InvoiceDocument'

function fmt(amount: number) {
  return `BDT ${Number(amount).toFixed(2)}`
}

export function PrintableInvoice({ data, locale = 'en' }: { data: InvoiceData; locale?: 'en' | 'bn' }) {
  const orderNum = `ORD-${String(data.orderNumber).padStart(6, '0')}`
  // Noto Sans Bengali / Hind Siliguri render Bangla correctly in the browser.
  // For English, Arial is sufficient.
  const fontFamily =
    locale === 'bn'
      ? "'Noto Sans Bengali', 'Hind Siliguri', Arial, sans-serif"
      : 'Arial, sans-serif'

  return (
    <div
      className="hidden print:block"
      lang={locale === 'bn' ? 'bn' : undefined}
      style={{ fontFamily, maxWidth: 700, margin: '0 auto', padding: 40 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{data.sellerName}</h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>INVOICE</div>
          <div style={{ color: '#666' }}>{orderNum}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {new Date(data.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>
          Bill To
        </div>
        <div style={{ fontWeight: 'bold' }}>{data.customerName}</div>
        <div style={{ color: '#666' }}>{data.customerPhone}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr
            style={{
              borderBottom: '2px solid #E5E7EB',
              fontSize: 10,
              textTransform: 'uppercase',
              color: '#666',
            }}
          >
            <th style={{ textAlign: 'left', padding: '8px 0' }}>Item</th>
            <th style={{ textAlign: 'center', padding: '8px 0' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '8px 0' }}>Unit Price</th>
            <th style={{ textAlign: 'right', padding: '8px 0' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '8px 0' }}>{item.productNameSnapshot}</td>
              <td style={{ padding: '8px 0', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{fmt(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', gap: 40 }}>
          <span style={{ color: '#666' }}>Subtotal</span>
          <span>{fmt(data.subtotal)}</span>
        </div>
        {data.deliveryFee > 0 && (
          <div style={{ display: 'flex', gap: 40 }}>
            <span style={{ color: '#666' }}>Delivery</span>
            <span>{fmt(data.deliveryFee)}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 40, fontWeight: 'bold', fontSize: 16 }}>
          <span>Total</span>
          <span>{fmt(data.total)}</span>
        </div>
      </div>
    </div>
  )
}
