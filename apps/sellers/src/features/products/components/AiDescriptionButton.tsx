'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAiQuota } from '../hooks/useAiQuota'

interface Props {
  productName: string
  category?: string
  onGenerated: (text: string, isFallback: boolean) => void
}

export function AiDescriptionButton({ productName, category, onGenerated }: Props) {
  const { quota, loading: quotaLoading } = useAiQuota()
  const [status, setStatus] = useState<'idle' | 'queued' | 'done' | 'error'>('idle')
  const [jobId, setJobId] = useState<string | null>(null)

  const handleGenerated = useCallback(onGenerated, [onGenerated])

  // Poll for result while job is queued
  useEffect(() => {
    if (!jobId || status !== 'queued') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/result/${jobId}`,
          { credentials: 'include' },
        )
        const data = await res.json()

        if (data.status === 'done') {
          clearInterval(interval)
          setStatus('done')
          setJobId(null)
          if (data.fallback) {
            toast.warning('AI unavailable — using a basic description instead')
          }
          handleGenerated(data.text, data.fallback)
        }
      } catch {
        clearInterval(interval)
        setStatus('error')
        toast.error('Failed to fetch AI result')
      }
    }, 2_000)

    return () => clearInterval(interval)
  }, [jobId, status, handleGenerated])

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast.error('Enter a product name first')
      return
    }

    setStatus('queued')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product_description',
          payload: { productName, category: category ?? 'General' },
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'AI generation failed')
        setStatus('idle')
        return
      }

      setJobId(data.jobId)
    } catch {
      toast.error('Request failed')
      setStatus('idle')
    }
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={quotaLoading || status === 'queued' || quota?.limit === 0}
      title={quota?.limit === 0 ? 'Upgrade to Growth plan to use AI features' : undefined}
      className="flex items-center gap-2 text-sm border rounded px-3 py-1.5 min-h-[44px] hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {status === 'queued' ? (
        <>
          <span className="animate-spin inline-block">⟳</span>
          Generating...
        </>
      ) : quota?.limit === 0 ? (
        <>
          <span>🔒</span>
          Upgrade to use AI
        </>
      ) : (
        <>
          <span>✨</span>
          Write with AI
        </>
      )}
    </button>
  )
}
