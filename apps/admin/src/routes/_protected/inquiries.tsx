import { createFileRoute } from '@tanstack/react-router'
import { useGetInquiriesQuery } from '../../store/adminApiSlice'

function InquiriesPage() {
  const { data: inquiries, isLoading } = useGetInquiriesQuery({})

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inquiries</h1>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="space-y-3">
        {inquiries?.map((inq) => (
          <div key={inq.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{inq.businessName}</span>
              <span className="text-gray-400">{new Date(inq.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{inq.email}</p>
            <p className="text-sm">{inq.message}</p>
            <span
              className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                inq.status === 'resolved'
                  ? 'bg-green-100 text-green-700'
                  : inq.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {inq.status.replace('_', ' ')}
            </span>
          </div>
        ))}

        {!isLoading && inquiries?.length === 0 && (
          <p className="text-sm text-gray-400">No inquiries yet.</p>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_protected/inquiries')({
  component: InquiriesPage,
})
