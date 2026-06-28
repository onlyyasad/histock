'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useLoginMutation } from '@/features/auth/api/authApi'
import { getErrorMessage } from '@/lib/apiError'
import { loginFormSchema, type LoginFormValues } from './schemas/authFormSchemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
      const e = err as { status?: number; data?: { retryAfterSeconds?: number } }
      if (e?.status === 429) {
        toast.error(`Too many attempts. Try again in ${e?.data?.retryAfterSeconds ?? 60}s.`)
      } else {
        toast.error(getErrorMessage(err, 'Login failed'))
      }
    }
  }

  return (
    <Card className="w-full max-w-md shadow">
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              autoComplete="email"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              autoComplete="current-password"
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          No account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
