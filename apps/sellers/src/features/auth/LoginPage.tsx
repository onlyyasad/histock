'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { useLoginMutation } from '@/store/authApi'
import { loginFormSchema, type LoginFormValues } from './schemas/authFormSchemas'

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [login, { isLoading }] = useLoginMutation()

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      toast.success('Password updated. Sign in with your new password.')
    }
  }, [searchParams])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values).unwrap()
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string; retryAfterSeconds?: number } }
      if (e?.status === 429) {
        toast.error(`Too many attempts. Try again in ${e?.data?.retryAfterSeconds ?? 60}s.`)
      } else {
        toast.error(e?.data?.error ?? 'Login failed')
      }
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold">Sign In</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            {...form.register('password')}
            className="w-full border rounded px-3 py-2"
            autoComplete="current-password"
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
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm">
        No account?{' '}
        <Link href="/register" className="text-indigo-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
