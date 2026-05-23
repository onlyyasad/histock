function fmt(amount: number) {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  data: {
    revenue: number
    cost: number
    profit: number
    margin: number
  }
}

export function PnlSummary({ data }: Props) {
  const isPositive = data.profit >= 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">Revenue</p>
        <p className="text-2xl font-bold">{fmt(data.revenue)}</p>
      </div>
      <div className="bg-white border rounded-lg p-4">
        <p className="text-sm text-gray-500">COGS</p>
        <p className="text-2xl font-bold">{fmt(data.cost)}</p>
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
  )
}
