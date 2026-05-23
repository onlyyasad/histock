'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAiQuota } from '../hooks/useAiQuota'

interface Props {
  productName: string
  price?: number | null
}

type Platform = 'whatsapp' | 'facebook'

export function SocialPostButton({ productName, price }: Props) {
  const { quota } = useAiQuota()
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<Platform>('facebook')
  const [status, setStatus] = useState<'idle' | 'queued' | 'done' | 'error'>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [generatedText, setGeneratedText] = useState<string | null>(null)

  const handleResult = useCallback((text: string, isFallback: boolean) => {
    setGeneratedText(text)
    setStatus('done')
    setJobId(null)
    if (isFallback) {
      toast.warning('AI unavailable — using a template post instead')
    }
  }, [])

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
          handleResult(data.text, data.fallback)
        }
      } catch {
        clearInterval(interval)
        setStatus('error')
        toast.error('Failed to fetch AI result')
      }
    }, 2_000)

    return () => clearInterval(interval)
  }, [jobId, status, handleResult])

  const handleGenerate = async () => {
    if (!productName.trim()) return

    setGeneratedText(null)
    setStatus('queued')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'social_post',
          payload: {
            productName,
            platform,
            price: price != null ? `৳${price.toFixed(2)}` : undefined,
          },
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

  const handleCopy = async () => {
    if (!generatedText) return
    await navigator.clipboard.writeText(generatedText)
    toast.success('Copied to clipboard')
  }

  const handleOpen = () => {
    setOpen(true)
    setStatus('idle')
    setGeneratedText(null)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={quota?.limit === 0}
        title={quota?.limit === 0 ? 'Upgrade to Growth plan to use AI features' : undefined}
      >
        {quota?.limit === 0 ? (
          <>
            <span className="mr-1.5">🔒</span>
            Upgrade to use AI
          </>
        ) : (
          <>
            <span className="mr-1.5">📣</span>
            Create Post
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Social Post</DialogTitle>
            <DialogDescription>
              Generate a caption for {productName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Platform toggle */}
            <div className="flex gap-2">
              {(['facebook', 'whatsapp'] as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p)
                    setGeneratedText(null)
                    setStatus('idle')
                  }}
                  className={`flex-1 rounded border px-3 py-1.5 text-sm transition-colors ${
                    platform === p
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  {p === 'facebook' ? '📘 Facebook' : '💬 WhatsApp'}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={status === 'queued'}
              className="w-full flex items-center justify-center gap-2 rounded border px-4 py-2 text-sm font-medium hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'queued' ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  {generatedText ? 'Regenerate' : 'Generate Caption'}
                </>
              )}
            </button>

            {/* Result */}
            {generatedText && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                <p className="text-sm whitespace-pre-wrap">{generatedText}</p>
                <Button size="sm" variant="secondary" className="w-full" onClick={handleCopy}>
                  📋 Copy to clipboard
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
