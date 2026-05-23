interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  variant?: 'default' | 'warning' | 'danger'
}

export function StatCard({ label, value, subtext, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'bg-white',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  }

  return (
    <div className={`rounded-lg border p-5 shadow-sm ${variantClasses[variant]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  )
}
