import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ClipboardList, ChevronsUpDown } from 'lucide-react'
import { useGetAuditLogQuery, useGetBusinessesQuery, type AdminAuditLog } from '@/store/adminApiSlice'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Paginator } from '@/components/shared/Paginator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { formatDate, formatDateTime, formatRelative } from '@/lib/format'
import { humanizeAuditAction, parseAuditAction } from '@/lib/audit'

function AuditLogPage() {
  const [page, setPage] = useState(1)

  // Combobox state
  const [comboOpen, setComboOpen] = useState(false)
  const [comboSearch, setComboSearch] = useState('')
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)

  // Free-text ID fallback
  const [showIdInput, setShowIdInput] = useState(false)
  const [rawId, setRawId] = useState('')

  const { data: matchingBusinesses } = useGetBusinessesQuery({ search: comboSearch || undefined, page: 1 })

  const activeBusinessId = selected?.id ?? (rawId || undefined)

  const { data: logs, isLoading } = useGetAuditLogQuery({
    businessId: activeBusinessId,
    page,
  })

  const groups = (logs ?? []).reduce<Record<string, AdminAuditLog[]>>((acc, log) => {
    const day = new Date(log.createdAt).toDateString()
    ;(acc[day] ??= []).push(log)
    return acc
  }, {})

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Audit Log" description="Every admin action, recorded." />

      <div className="flex flex-wrap gap-3 items-center">
        {/* Business combobox */}
        <Popover open={comboOpen} onOpenChange={(o) => setComboOpen(o)}>
          <PopoverTrigger className="inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground w-full sm:w-64">
            {selected ? selected.name : 'All businesses'}
            <ChevronsUpDown className="size-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search businesses…"
                value={comboSearch}
                onValueChange={setComboSearch}
              />
              <CommandList>
                <CommandEmpty>No businesses found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__all__"
                    onSelect={() => {
                      setSelected(null)
                      setRawId('')
                      setPage(1)
                      setComboOpen(false)
                    }}
                  >
                    All businesses
                  </CommandItem>
                  {matchingBusinesses?.map((b) => (
                    <CommandItem
                      key={b.id}
                      value={b.id}
                      onSelect={() => {
                        setSelected({ id: b.id, name: b.name })
                        setRawId('')
                        setPage(1)
                        setComboOpen(false)
                      }}
                    >
                      {b.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Free-text ID fallback */}
        {!showIdInput ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIdInput(true)}
          >
            Filter by ID
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Business UUID…"
              value={rawId}
              onChange={(e) => {
                setRawId(e.target.value)
                setSelected(null)
                setPage(1)
              }}
              className="w-56"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setRawId(''); setShowIdInput(false) }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : logs?.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No audit logs found"
          description="Actions performed by admins will appear here."
        />
      ) : (
        <div className="space-y-2">
          {Object.entries(groups).map(([day, dayLogs]) => (
            <div key={day}>
              <p className="text-xs font-medium text-muted-foreground pt-2">{formatDate(day)}</p>
              {dayLogs.map((log) => {
                const { method, path } = parseAuditAction(log.action)
                return (
                  <Card key={log.id} className="mt-1">
                    <CardContent className="flex items-start justify-between gap-4 py-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {method && (
                            <Badge variant="secondary" className="font-mono">
                              {method}
                            </Badge>
                          )}
                          <p className="text-sm font-medium">{humanizeAuditAction(log.action)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">{path}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.adminEmail}
                          {log.targetBusinessId && <> · Business: {log.targetBusinessId}</>}
                        </p>
                      </div>
                      <span
                        className="text-xs text-muted-foreground whitespace-nowrap"
                        title={formatDateTime(log.createdAt)}
                      >
                        {formatRelative(log.createdAt)}
                      </span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ))}
        </div>
      )}

      <Paginator
        page={page}
        onPageChange={setPage}
        hasNext={(logs?.length ?? 0) >= 50}
      />
    </div>
  )
}

export const Route = createFileRoute('/_protected/audit-log')({
  component: AuditLogPage,
})
