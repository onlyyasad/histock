'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useGetAiUsageQuery, useGenerateAiMutation, useGetAiResultQuery } from '@/store/aiApi'

interface Props {
  productName: string
  price?: number | null
}

type Platform = 'whatsapp' | 'facebook'

export function SocialPostButton({ productName, price }: Props) {
  const { data: quota } = useGetAiUsageQuery()
  const [generateAi] = useGenerateAiMutation()
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<Platform>('facebook')
  const [jobId, setJobId] = useState<string | null>(null)
  const [generatedText, setGeneratedText] = useState<string | null>(null)

  const { data: pollResult } = useGetAiResultQuery(jobId ?? '', {
    skip: !jobId,
    pollingInterval: 2_000,
  })

  if (pollResult?.status === 'done' && jobId) {
    setJobId(null)
    if (pollResult.fallback) {
      toast.warning('AI unavailable — using a template post instead')
    }
    setGeneratedText(pollResult.text ?? '')
  }

  const isPolling = !!jobId && pollResult?.status !== 'done'

  const handleGenerate = async () => {
    if (!productName.trim()) return
    setGeneratedText(null)
    try {
      const { jobId: id } = await generateAi({
        type: 'social_post',
        payload: {
          productName,
          platform,
          price: price != null ? `৳${Number(price).toFixed(2)}` : '',
        },
      }).unwrap()
      setJobId(id)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      toast.error(e?.data?.error ?? 'AI generation failed')
    }
  }

  const handleCopy = async () => {
    if (!generatedText) return
    await navigator.clipboard.writeText(generatedText)
    toast.success('Copied to clipboard')
  }

  const handleOpen = () => {
    setOpen(true)
    setGeneratedText(null)
    setJobId(null)
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
          <><span className="mr-1.5">🔒</span>Upgrade to use AI</>
        ) : (
          <><span className="mr-1.5">📣</span>Create Post</>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Social Post</DialogTitle>
            <DialogDescription>Generate a caption for {productName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {(['facebook', 'whatsapp'] as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p)
                    setGeneratedText(null)
                    setJobId(null)
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

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPolling}
              className="w-full flex items-center justify-center gap-2 rounded border px-4 py-2 text-sm font-medium hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPolling ? (
                <><span className="animate-spin inline-block">⟳</span>Generating...</>
              ) : (
                <><span>✨</span>{generatedText ? 'Regenerate' : 'Generate Caption'}</>
              )}
            </button>

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
