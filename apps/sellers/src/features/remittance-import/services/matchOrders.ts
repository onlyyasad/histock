export interface ColumnMapping {
  orderNumberCol: string | null
  amountCol: string | null
}

const ORDER_NUMBER_HINTS = ['order', 'tracking', 'ref', 'parcel', 'id', 'orderno', 'order_no', 'order id']
const AMOUNT_HINTS = ['cod', 'amount', 'price', 'cash', 'collect', 'bdt', 'taka', 'collection']

export function guessColumnMapping(headers: string[]): { mapping: ColumnMapping; confidence: number } {
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '')

  let orderCol: string | null = null
  let amountCol: string | null = null
  let orderScore = 0
  let amountScore = 0

  for (const h of headers) {
    const n = normalize(h)
    const oScore = ORDER_NUMBER_HINTS.reduce(
      (max, hint) => (n.includes(normalize(hint)) ? Math.max(max, hint.length / n.length) : max),
      0,
    )
    const aScore = AMOUNT_HINTS.reduce(
      (max, hint) => (n.includes(normalize(hint)) ? Math.max(max, hint.length / n.length) : max),
      0,
    )
    if (oScore > orderScore) { orderScore = oScore; orderCol = h }
    if (aScore > amountScore) { amountScore = aScore; amountCol = h }
  }

  return {
    mapping: { orderNumberCol: orderCol, amountCol },
    confidence: Math.round(((orderScore + amountScore) / 2) * 100),
  }
}

export interface MatchResult {
  orderId: string
  orderNumber: number
  codAmount: number
  rawRow: Record<string, string>
}

export interface UnmatchedRow {
  rawOrderNumber: string
  rawAmount: string
  reason: string
}

export function matchRowsToOrders(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  knownOrders: Array<{ id: string; orderNumber: number }>,
): { matched: MatchResult[]; unmatched: UnmatchedRow[] } {
  const orderMap = new Map(knownOrders.map((o) => [o.orderNumber, o]))
  const matched: MatchResult[] = []
  const unmatched: UnmatchedRow[] = []

  for (const row of rows) {
    const rawOrderNum = mapping.orderNumberCol ? (row[mapping.orderNumberCol] ?? '') : ''
    const rawAmount = mapping.amountCol ? (row[mapping.amountCol] ?? '') : ''

    const numMatch = rawOrderNum.match(/\d+/)
    const orderNumber = numMatch ? parseInt(numMatch[0], 10) : NaN
    const codAmount = parseFloat(rawAmount.replace(/[৳,BDT\s]/g, ''))

    if (isNaN(orderNumber)) {
      unmatched.push({ rawOrderNumber: rawOrderNum, rawAmount, reason: 'Could not parse order number' })
      continue
    }

    const order = orderMap.get(orderNumber)
    if (!order) {
      unmatched.push({
        rawOrderNumber: rawOrderNum,
        rawAmount,
        reason: `Order ORD-${String(orderNumber).padStart(6, '0')} not found`,
      })
      continue
    }

    if (isNaN(codAmount)) {
      unmatched.push({ rawOrderNumber: rawOrderNum, rawAmount, reason: 'Could not parse amount' })
      continue
    }

    matched.push({ orderId: order.id, orderNumber: order.orderNumber, codAmount, rawRow: row })
  }

  return { matched, unmatched }
}
