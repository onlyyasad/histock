'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useGetAiUsageQuery, useGenerateAiMutation, useGetAiResultQuery } from '@/store/aiApi'

interface Props {
  productName: string
  category?: string
  onGenerated: (text: string, isFallback: boolean) => void
}

export function AiDescriptionButton({ productName, category, onGenerated }: Props) {
  const { data: quota } = useGetAiUsageQuery()
  const [generateAi, { isLoading: isQueuing }] = useGenerateAiMutation()
  const [jobId, setJobId] = useState<string | null>(null)

  const { data: result } = useGetAiResultQuery(jobId ?? '', {
    skip: !jobId,
    pollingInterval: 2_000,
  })

  if (result?.status === 'done' && jobId) {
    setJobId(null)
    if (result.fallback) {
      toast.warning('AI unavailable — using a basic description instead')
    }
    onGenerated(result.text ?? '', result.fallback ?? false)
  }

  const isPolling = !!jobId && result?.status !== 'done'
  const disabled = isQueuing || isPolling || quota?.limit === 0

  const handleGenerate = async () => {
    if (!productName.trim()) {
      toast.error('Enter a product name first')
      return
    }
    try {
      const { jobId: id } = await generateAi({
        type: 'product_description',
        payload: { productName, category: category ?? 'General' },
      }).unwrap()
      setJobId(id)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; code?: string } }
      if (e?.data?.code === 'AI_LIMIT_REACHED') {
        toast.error(e.data.error ?? 'Daily AI limit reached')
      } else {
        toast.error('AI generation failed')
      }
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={disabled}
      title={quota?.limit === 0 ? 'Upgrade to Growth plan to use AI features' : undefined}
      className="flex items-center gap-2 min-h-[44px] hover:bg-purple-50 hover:border-purple-300"
    >
      {isPolling || isQueuing ? (
        <><span className="animate-spin inline-block">⟳</span>Generating...</>
      ) : quota?.limit === 0 ? (
        <><span>🔒</span>Upgrade to use AI</>
      ) : (
        <><span>✨</span>Write with AI</>
      )}
    </Button>
  )
}
