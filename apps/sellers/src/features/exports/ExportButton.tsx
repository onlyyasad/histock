'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { axiosInstance } from '@/core/api/axiosInstance'

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
      const response = await axiosInstance.get(endpoint, {
        params,
        responseType: 'blob',
      })
      const objectUrl = URL.createObjectURL(response.data as Blob)
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
