import type { Metadata } from 'next'
import { Figtree, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from "@/lib/utils";

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HiStock — Sales Management',
  description: 'The back-office for social commerce sellers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HiStock',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", figtree.variable, geistMono.variable)}>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
