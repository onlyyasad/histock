'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setRateLimited(false)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.status === 429) {
        setRateLimited(true)
        return
      }
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md w-full text-center space-y-4 bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-gray-500">
          If that email is registered, a reset link has been sent. It expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm underline">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full bg-white rounded-lg shadow p-8 space-y-4"
    >
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="text-gray-500 text-sm">
        Enter your email and we&apos;ll send a reset link if the account exists.
      </p>

      {rateLimited && (
        <p role="alert" className="text-red-600 text-sm">
          Too many requests. Please wait an hour before trying again.
        </p>
      )}

      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded font-medium disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>
      <Link href="/login" className="block text-sm text-center underline">
        Back to login
      </Link>
    </form>
  )
}
