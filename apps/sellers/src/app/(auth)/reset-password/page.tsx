'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useResetPasswordMutation } from '@/store/authApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow">
        <CardContent className="pt-6">
          <p className="text-destructive text-sm">
            Invalid reset link. Please{' '}
            <Link href="/forgot-password" className="underline text-primary">
              request a new one
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    )
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await resetPassword({ token, password: values.password }).unwrap()
      toast.success('Password updated. Sign in with your new password.')
      router.push('/login?reset=success')
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } }
      toast.error(e?.data?.error ?? 'Reset failed. The link may have expired.')
    }
  }

  return (
    <Card className="w-full max-w-md shadow">
      <CardHeader>
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password of at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rp-password">New password</Label>
            <Input
              id="rp-password"
              type="password"
              {...form.register('password')}
              autoComplete="new-password"
              placeholder="Min 8 characters"
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-confirm">Confirm password</Label>
            <Input
              id="rp-confirm"
              type="password"
              {...form.register('confirm')}
              autoComplete="new-password"
              placeholder="Repeat your password"
            />
            {form.formState.errors.confirm && (
              <p className="text-destructive text-sm">{form.formState.errors.confirm.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating…
              </>
            ) : (
              'Set new password'
            )}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
