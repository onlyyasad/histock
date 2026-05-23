'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Props {
  endpoint: string
  label: string
  filename?: string
  params?: Record<string, string | undefined>
}

export function ExportButton({ endpoint, label, filename, params }: Props) {
  const [downloading, setDownloading] = useState(false)

  const handleExport = async () => {
    setDownloading(true)
    try {
      const url = new URL(endpoint, process.env.NEXT_PUBLIC_API_URL)
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) url.searchParams.set(k, v)
        })
      }

      const res = await fetch(url.toString(), { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename ?? `export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)

      toast.success('Download started')
    } catch {
      toast.error('Export failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={downloading}>
      <Download className="h-4 w-4 mr-1" />
      {downloading ? 'Exporting...' : label}
    </Button>
  )
}
