'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCircle2, Check } from 'lucide-react'
import { parseFile, type ParsedRow } from '../services/parseFile'
import {
  guessColumnMapping,
  matchRowsToOrders,
  type ColumnMapping,
  type MatchResult,
  type UnmatchedRow,
} from '../services/matchOrders'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { useGetCouriersQuery } from '@/features/financials/api/financialsApi'
import { useCreateRemittanceImportMutation } from '@/features/analytics/api/analyticsApi'
import { useLazyGetOrdersQuery } from '@/features/orders/api/ordersApi'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'map' | 'preview' | 'done'

const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'map', label: 'Map columns' },
  { key: 'preview', label: 'Review & confirm' },
] as const

export function RemittanceImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({ orderNumberCol: null, amountCol: null })
  const [confidence, setConfidence] = useState(0)
  const [matched, setMatched] = useState<MatchResult[]>([])
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([])
  const [courierId, setCourierId] = useState('')
  const [batchName, setBatchName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const { data: couriers = [] } = useGetCouriersQuery()
  const [fetchOrders] = useLazyGetOrdersQuery()
  const [createRemittanceImport] = useCreateRemittanceImportMutation()

  const handleFile = useCallback(async (file: File) => {
    try {
      const { headers: h, rows: r } = await parseFile(file)
      setFileName(file.name)
      setHeaders(h)
      setRows(r)
      const { mapping: m, confidence: c } = guessColumnMapping(h)
      setMapping(m)
      setConfidence(c)
      setStep('map')
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }, [])

  const handleColumnConfirm = async () => {
    const orders = await fetchOrders({
      paymentMethod: 'cod',
      status: 'handover_to_courier',
      limit: 1000,
    }).unwrap()

    const { matched: m, unmatched: u } = matchRowsToOrders(rows, mapping, orders)
    setMatched(m)
    setUnmatched(u)
    if (couriers.length > 0) setCourierId(couriers[0].id)
    setBatchName(`Remittance ${new Date().toLocaleDateString('en-BD')}`)
    setStep('preview')
  }

  const handleImport = async () => {
    if (matched.length === 0 || !courierId) return
    setIsImporting(true)
    try {
      await createRemittanceImport({
        courierId,
        batchName,
        fileName,
        orders: matched.map((m) => ({ orderId: m.orderId, codAmount: m.codAmount })),
        unmatchedCount: unmatched.length,
      }).unwrap()
      setStep('done')
    } catch {
      toast.error('Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const confidenceColor =
    confidence >= 70 ? 'text-success' : confidence >= 40 ? 'text-warning' : 'text-destructive'

  const stepIndex = step === 'upload' ? 0 : step === 'map' ? 1 : 2

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Import COD remittance"
        description="Upload a courier CSV to reconcile expected payouts."
      />

      {/* Stepper indicator — only shown during upload/map/preview */}
      {step !== 'done' && (
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isCompleted = i < stepIndex
            const isCurrent = i === stepIndex
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className={cn(
                      'size-6 rounded-full border flex items-center justify-center text-xs',
                      isCompleted && 'bg-primary text-primary-foreground border-primary',
                      isCurrent && 'border-primary text-primary font-medium',
                      !isCompleted && !isCurrent && 'border-border text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="size-3.5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs whitespace-nowrap',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1 bg-border mb-4" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {step === 'upload' && (
        <div
          className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-muted/30 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            id="file-input"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          <label htmlFor="file-input" className="cursor-pointer block">
            <p className="text-lg text-muted-foreground">Drop courier CSV or XLSX here</p>
            <p className="text-sm text-muted-foreground/60 mt-2">or click to browse</p>
            <p className="text-xs text-muted-foreground/40 mt-4">
              Supports Pathao, REDX, eCourier, SA Paribahan formats
            </p>
          </label>
        </div>
      )}

      {step === 'map' && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Auto-detection confidence:</span>
              <span className={`text-sm font-bold ${confidenceColor}`}>{confidence}%</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Column containing order number</Label>
                <Select
                  value={mapping.orderNumberCol ?? ''}
                  onValueChange={(v) => setMapping((m) => ({ ...m, orderNumberCol: v || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Column containing COD amount</Label>
                <Select
                  value={mapping.amountCol ?? ''}
                  onValueChange={(v) => setMapping((m) => ({ ...m, amountCol: v || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {rows.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Preview — first row: {Object.entries(rows[0]).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </p>
            )}

            <Button
              onClick={handleColumnConfirm}
              disabled={!mapping.orderNumberCol || !mapping.amountCol}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 hover:bg-success/10">
              {matched.length} matched
            </Badge>
            {unmatched.length > 0 && (
              <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                {unmatched.length} unmatched
              </Badge>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="max-h-48 overflow-y-auto divide-y">
                {matched.map((r) => (
                  <div key={r.orderId} className="flex justify-between text-sm px-4 py-2">
                    <span className="font-mono">ORD-{String(r.orderNumber).padStart(6, '0')}</span>
                    <span className="font-mono tabular-nums">৳{r.codAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {unmatched.length > 0 && (
            <Card className="border-warning/30">
              <CardContent className="p-0">
                <p className="text-sm font-medium text-warning px-4 pt-3 pb-2">Unmatched rows:</p>
                <div className="max-h-32 overflow-y-auto divide-y divide-warning/20">
                  {unmatched.map((r, i) => (
                    <div key={i} className="flex justify-between text-sm px-4 py-2">
                      <span>{r.rawOrderNumber}</span>
                      <span className="text-muted-foreground text-xs">{r.reason}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Courier</Label>
              <Select value={courierId} onValueChange={(v) => { if (v) setCourierId(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select courier..." />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Batch name</Label>
              <Input
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={isImporting || matched.length === 0 || !courierId}
            className="w-full"
          >
            {isImporting ? 'Importing...' : `Create Batch — ${matched.length} Orders`}
          </Button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-10 space-y-3">
          <CheckCircle2 className="size-10 text-success mx-auto" />
          <p className="font-semibold">Remittance batch created</p>
          <Link
            href="/remittance"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View in Remittance Tracker
          </Link>
        </div>
      )}
    </div>
  )
}
