'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        setError(body.error ?? 'Reset failed. The link may have expired.')
        return
      }
      router.push('/login?reset=success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <p className="text-red-600">
        Invalid reset link. Please request a new one from the{' '}
        <a href="/forgot-password" className="underline">
          forgot password page
        </a>
        .
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full bg-white rounded-lg shadow p-8 space-y-4"
    >
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium mb-1">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          placeholder="Min 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          placeholder="Repeat your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded px-3 py-2"
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded font-medium disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Set new password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
