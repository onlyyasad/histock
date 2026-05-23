'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRegisterMutation } from '@/store/authApi'
import { registerFormSchema, type RegisterFormValues } from './schemas/authFormSchemas'

export function RegisterPage() {
  const router = useRouter()
  const [register, { isLoading }] = useRegisterMutation()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { businessName: '', name: '', email: '', password: '' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values).unwrap()
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string } }
      if (e?.status === 409) {
        form.setError('email', { message: 'An account with this email already exists' })
      } else {
        toast.error(e?.data?.error ?? 'Registration failed')
      }
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
      <div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">14-day free trial, no credit card required.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium mb-1">
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            {...form.register('businessName')}
            className="w-full border rounded px-3 py-2"
            placeholder="My Shop"
          />
          {form.formState.errors.businessName && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.businessName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Your name
          </label>
          <input
            id="name"
            type="text"
            {...form.register('name')}
            className="w-full border rounded px-3 py-2"
            autoComplete="name"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...form.register('email')}
            className="w-full border rounded px-3 py-2"
            autoComplete="email"
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...form.register('password')}
            className="w-full border rounded px-3 py-2"
            autoComplete="new-password"
          />
          {form.formState.errors.password && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
