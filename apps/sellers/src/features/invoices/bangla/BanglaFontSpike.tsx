'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Verification component only — not for production use.
// Visit /dev/bangla-font-spike to evaluate Bangla shaping in @react-pdf/renderer.

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((m) => m.PDFViewer),
  { ssr: false },
)

const FontTestDocument = dynamic(
  () => import('./FontTestDocument').then((m) => m.FontTestDocument),
  { ssr: false },
)

export function BanglaFontSpike() {
  return (
    <div className="h-screen w-full">
      <Suspense fallback={<p className="p-6 text-muted-foreground">Loading PDF viewer...</p>}>
        <PDFViewer width="100%" height="100%">
          <FontTestDocument />
        </PDFViewer>
      </Suspense>
    </div>
  )
}
