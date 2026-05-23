import { useState, useEffect } from 'react'

interface AiQuota {
  limit: number
  used: number
  remaining: number
}

export function useAiQuota() {
  const [quota, setQuota] = useState<AiQuota | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ai/usage`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: AiQuota) => setQuota(data))
      .catch(() => setQuota(null))
      .finally(() => setLoading(false))
  }, [])

  return { quota, loading }
}
