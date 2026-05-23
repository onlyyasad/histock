import type { Metadata } from 'next'
import { Sora, Geist } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("h-full", "antialiased", sora.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-sora)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
