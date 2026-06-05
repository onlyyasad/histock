import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useGetAuditLogQuery } from '@/store/adminApiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

function AuditLogPage() {
  const [businessId, setBusinessId] = useState('')
  const [page, setPage] = useState(1)

  const { data: logs, isLoading } = useGetAuditLogQuery({
    businessId: businessId || undefined,
    page,
  })

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <Input
        placeholder="Filter by business ID…"
        value={businessId}
        onChange={(e) => { setBusinessId(e.target.value); setPage(1) }}
        className="max-w-xs"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {logs?.length === 0 && (
            <p className="text-sm text-muted-foreground">No audit logs found.</p>
          )}
          {logs?.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-start justify-between gap-4 py-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {log.method} {log.path}
                    </Badge>
                    {log.targetBusinessId && (
                      <span className="text-xs text-muted-foreground">
                        Business: {log.targetBusinessId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{log.action}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!logs || logs.length < 50}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/audit-log')({
  component: AuditLogPage,
})
