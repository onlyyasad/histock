import { Link, Outlet } from '@tanstack/react-router'

const NAV = [
  { to: '/', label: 'Businesses' },
  { to: '/audit-log', label: 'Audit Log' },
  { to: '/inquiries', label: 'Inquiries' },
]

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-52 bg-white border-r flex flex-col p-4 gap-1">
        <p className="text-xs font-bold text-gray-400 uppercase mb-3">HiStock Admin</p>
        {NAV.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="text-sm px-3 py-2 rounded hover:bg-gray-100 text-gray-700"
            activeProps={{ className: 'bg-gray-100 font-medium' }}
          >
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
