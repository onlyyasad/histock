import { createFileRoute } from '@tanstack/react-router'
import { useGetAuditLogQuery } from '../../store/adminApiSlice'

function AuditLogPage() {
  const { data: logs, isLoading } = useGetAuditLogQuery({})

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="space-y-2">
        {logs?.map((log) => (
          <div key={log.id} className="bg-white border rounded-lg p-4 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                {log.method} {log.path}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-600">{log.action}</p>
            {log.targetBusinessId && (
              <p className="text-xs text-gray-400 mt-0.5">
                Business: {log.targetBusinessId}
              </p>
            )}
          </div>
        ))}

        {!isLoading && logs?.length === 0 && (
          <p className="text-sm text-gray-400">No audit logs yet.</p>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/audit-log')({
  component: AuditLogPage,
})
