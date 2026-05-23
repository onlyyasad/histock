function fmt(amount: number) {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  data: {
    revenue: number
    cogs: number
    deliveryFees: number
    refunds: number
    profit: number
    margin: number
    orderCount: number
  }
}

export function PnlSummary({ data }: Props) {
  const isPositive = data.profit >= 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold">{fmt(data.revenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.orderCount} orders</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">COGS</p>
          <p className="text-2xl font-bold">{fmt(data.cogs)}</p>
          <p className="text-xs text-gray-400 mt-1">Cost of goods sold</p>
        </div>
        <div
          className={`border rounded-lg p-4 ${
            isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <p className="text-sm text-gray-500">Gross Profit</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {fmt(data.profit)}
          </p>
          <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {data.margin.toFixed(1)}% margin
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Margin</p>
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {data.margin.toFixed(1)}%
          </p>
        </div>
      </div>

      {(data.deliveryFees > 0 || data.refunds > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Delivery Fees Collected</p>
            <p className="text-xl font-semibold">{fmt(data.deliveryFees)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">Refunds Issued</p>
            <p className="text-xl font-semibold text-red-600">{fmt(data.refunds)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
