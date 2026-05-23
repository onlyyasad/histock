import type { Response } from 'express'

// In-process SSE connection registry. All seller browser tabs that call
// GET /api/v1/sse register here; workers call `push` to broadcast events.
class SseManager {
  private connections = new Map<string, Set<Response>>()

  add(businessId: string, res: Response): void {
    if (!this.connections.has(businessId)) {
      this.connections.set(businessId, new Set())
    }
    this.connections.get(businessId)!.add(res)
  }

  remove(businessId: string, res: Response): void {
    this.connections.get(businessId)?.delete(res)
  }

  push(businessId: string, event: string, data: unknown): void {
    const conns = this.connections.get(businessId)
    if (!conns?.size) return
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of conns) {
      try {
        res.write(payload)
      } catch {
        conns.delete(res)
      }
    }
  }
}

export const sseManager = new SseManager()
