'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useRegisterMutation } from '@/store/authApi'
import { registerFormSchema, type RegisterFormValues } from './schemas/authFormSchemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
    <Card className="w-full max-w-md shadow">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>14-day free trial, no credit card required.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              type="text"
              {...form.register('businessName')}
              placeholder="My Shop"
            />
            {form.formState.errors.businessName && (
              <p className="text-destructive text-sm">{form.formState.errors.businessName.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Shown on your invoices</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              type="text"
              {...form.register('name')}
              autoComplete="name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              autoComplete="new-password"
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
