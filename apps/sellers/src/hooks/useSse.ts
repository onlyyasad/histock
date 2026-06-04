import { useEffect } from 'react'

type SseEventHandler = (type: string, data: unknown) => void

export function useSse(onEvent: SseEventHandler) {
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/schedules/sse`

    const es = new EventSource(url, { withCredentials: true })

    es.addEventListener('heartbeat', () => {
      // Keep-alive ping from backend — intentionally ignored.
    })

    es.addEventListener('reminder_fired', (e: MessageEvent) => {
      try {
        onEvent('reminder_fired', JSON.parse(e.data as string))
      } catch { /* ignore malformed */ }
    })

    es.addEventListener('ticket_message', (e: MessageEvent) => {
      try {
        onEvent('ticket_message', JSON.parse(e.data as string))
      } catch { /* ignore malformed */ }
    })

    es.onerror = () => {
      // EventSource auto-reconnects after error — no manual action needed.
    }

    return () => {
      es.close()
    }
  }, [onEvent])
}
