import { createFileRoute } from '@tanstack/react-router'
import { AdminGuard } from '../components/AdminGuard'
import { AdminLayout } from '../components/AdminLayout'

export const Route = createFileRoute('/_protected')({
  component: () => (
    <AdminGuard>
      <AdminLayout />
    </AdminGuard>
  ),
})
