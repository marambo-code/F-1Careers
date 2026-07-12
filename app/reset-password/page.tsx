'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    // The reset link is exchanged for a session in /auth/callback, so an
    // authenticated session exists by the time the user reaches this page.
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <img src="/emblem.png" alt="" className="h-7 w-7" />
          <span className="text-2xl font-bold text-white tracking-tight"><span className="text-teal">F-1</span> Careers</span>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-navy">Password updated</h2>
              <p className="text-sm text-mid">Redirecting you to your dashboard…</p>
              <Link href="/dashboard" className="inline-block text-sm text-teal font-semibold hover:underline">
                Go now →
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-navy mb-1">Set a new password</h1>
              <p className="text-sm text-mid mb-6">Choose a new password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input
                    type="password"
                    className="input"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-teal w-full py-3">
                  {loading ? 'Updating…' : 'Update password →'}
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
