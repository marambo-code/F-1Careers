'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">Check your email</h2>
          <p className="text-mid text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-navy">{email}</span>.
            <br />Click it to activate your account and get started.
          </p>
          <Link href="/login" className="btn-outline inline-block mt-6 text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold text-white tracking-tight">F-1 Careers</span>
            <span className="text-teal text-xs font-bold bg-teal/15 px-2 py-0.5 rounded-md border border-teal/20">AI</span>
          </div>
          <p className="text-blue-200 text-sm">AI Career Strategy Engine for International Professionals</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-navy mb-1">Create your account</h1>
          <p className="text-sm text-mid mb-6">Get your personalized AI career strategy report.</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Priya Sharma"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
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

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-teal w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-mid">
              Already have an account?{' '}
              <Link href="/login" className="text-teal font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
