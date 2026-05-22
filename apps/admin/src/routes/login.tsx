import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAdminLoginMutation } from '../store/adminApiSlice'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
})

function LoginPage() {
  const navigate = useNavigate()
  const [login, { isLoading }] = useAdminLoginMutation()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await login(values).unwrap()
      navigate({ to: '/' })
    } catch {
      toast.error('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...form.register('email')}
            type="email"
            placeholder="Email"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>
          )}
          <input
            {...form.register('password')}
            type="password"
            placeholder="Password"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
