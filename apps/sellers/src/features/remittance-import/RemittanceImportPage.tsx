'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { parseFile, type ParsedRow } from './utils/parseFile'
import {
  guessColumnMapping,
  matchRowsToOrders,
  type ColumnMapping,
  type MatchResult,
  type UnmatchedRow,
} from './utils/matchOrders'

type Step = 'upload' | 'map' | 'preview' | 'done'

interface Courier {
  id: string
  name: string
}

export function RemittanceImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({ orderNumberCol: null, amountCol: null })
  const [confidence, setConfidence] = useState(0)
  const [matched, setMatched] = useState<MatchResult[]>([])
  const [unmatched, setUnmatched] = useState<UnmatchedRow[]>([])
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [courierId, setCourierId] = useState('')
  const [batchName, setBatchName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

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
    const [ordersRes, couriersRes] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders?paymentMethod=cod&status=handover_to_courier&limit=1000`,
        { credentials: 'include' },
      ),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/couriers`, { credentials: 'include' }),
    ])

    const orders: Array<{ id: string; orderNumber: number }> = await ordersRes.json()
    const courierList: Courier[] = await couriersRes.json()

    const { matched: m, unmatched: u } = matchRowsToOrders(rows, mapping, orders)
    setMatched(m)
    setUnmatched(u)
    setCouriers(courierList)
    if (courierList.length > 0) setCourierId(courierList[0].id)
    setBatchName(`Remittance ${new Date().toLocaleDateString('en-BD')}`)
    setStep('preview')
  }

  const handleImport = async () => {
    if (matched.length === 0 || !courierId) return
    setIsImporting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/remittances/import`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierId,
          batchName,
          fileName,
          orders: matched.map((m) => ({ orderId: m.orderId, codAmount: m.codAmount })),
          unmatchedCount: unmatched.length,
        }),
      })
      if (!res.ok) throw new Error('Import failed')
      toast.success(`Remittance batch created — ${matched.length} orders`)
      setStep('done')
    } catch {
      toast.error('Failed to create remittance batch')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Import COD Remittance</h1>

      {step === 'upload' && (
        <div
          className="border-2 border-dashed rounded-lg p-10 text-center hover:bg-gray-50"
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
            <p className="text-lg text-gray-500">Drop courier CSV or XLSX here</p>
            <p className="text-sm text-gray-400 mt-2">or click to browse</p>
            <p className="text-xs text-gray-300 mt-4">Supports Pathao, REDX, eCourier, SA Paribahan formats</p>
          </label>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Auto-detection confidence:</span>
            <span
              className={`text-sm font-bold ${
                confidence >= 70 ? 'text-green-600' : confidence >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {confidence}%
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Column containing order number</label>
              <select
                value={mapping.orderNumberCol ?? ''}
                onChange={(e) => setMapping((m) => ({ ...m, orderNumberCol: e.target.value || null }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Column containing COD amount</label>
              <select
                value={mapping.amountCol ?? ''}
                onChange={(e) => setMapping((m) => ({ ...m, amountCol: e.target.value || null }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {rows.length > 0 && (
            <p className="text-xs text-gray-400">
              Preview — first row: {Object.entries(rows[0]).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </p>
          )}

          <button
            onClick={handleColumnConfirm}
            disabled={!mapping.orderNumberCol || !mapping.amountCol}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">{matched.length} matched</span>
            <span className="text-red-500">{unmatched.length} unmatched</span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {matched.map((r) => (
              <div key={r.orderId} className="flex justify-between text-sm bg-green-50 px-3 py-1.5 rounded">
                <span>ORD-{String(r.orderNumber).padStart(6, '0')}</span>
                <span>৳{r.codAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {unmatched.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              <p className="text-sm font-medium text-red-600">Unmatched rows:</p>
              {unmatched.map((r, i) => (
                <div key={i} className="flex justify-between text-sm bg-red-50 px-3 py-1.5 rounded">
                  <span>{r.rawOrderNumber}</span>
                  <span className="text-red-400 text-xs">{r.reason}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Courier</label>
              <select
                value={courierId}
                onChange={(e) => setCourierId(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Batch name</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || matched.length === 0 || !courierId}
            className="w-full bg-green-600 text-white py-3 rounded font-medium disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : `Create Batch — ${matched.length} Orders`}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-10">
          <p className="text-3xl">✓</p>
          <p className="font-semibold mt-3">Remittance batch created</p>
          <a href="/analytics/remittance" className="text-blue-600 hover:underline text-sm mt-2 block">
            View in Remittance Tracker
          </a>
        </div>
      )}
    </div>
  )
}
