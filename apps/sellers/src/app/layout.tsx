import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HiStock — Sales Management',
  description: 'The back-office for social commerce sellers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sora)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
