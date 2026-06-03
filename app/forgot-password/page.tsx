'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-white tracking-tight">F-1 Careers</span>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-navy">Check your email</h2>
              <p className="text-sm text-mid">We sent a password reset link to <strong>{email}</strong>.</p>
              <Link href="/login" className="inline-block text-sm text-teal font-semibold hover:underline">Back to sign in →</Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-navy mb-1">Reset your password</h1>
              <p className="text-sm text-mid mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-teal w-full py-3">
                  {loading ? 'Sending...' : 'Send reset link →'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-mid hover:text-navy">Back to sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
