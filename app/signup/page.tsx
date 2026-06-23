'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Prefill the email if the visitor left one in the Green Card Explorer.
  useEffect(() => {
    try {
      const e = sessionStorage.getItem('gc_prefill_email')
      if (e) { setEmail(e); setConfirmEmail(e); sessionStorage.removeItem('gc_prefill_email') }
    } catch { /* ignore */ }
  }, [])

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/start` },
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setError('The email addresses don’t match. Please re-enter them.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to create account')
      setLoading(false)
      return
    }

    // Email confirmation is disabled, so the account is active immediately.
    // /start routes the new user to profile setup, then the questionnaire.
    router.push('/start')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 no-underline">
            <span className="text-2xl font-bold text-white tracking-tight">F-1 Careers</span>
          </Link>
          <p className="text-blue-200 text-sm">Personalized Career and Visa Strategy for International Professionals</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <>
              <h1 className="text-xl font-bold text-navy mb-1">Create your account</h1>
              <p className="text-sm text-mid mb-6">Get your personalized green card strategy report.</p>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 text-sm font-semibold text-navy hover:bg-gray-50 transition-colors mb-4 disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-mid">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

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
                  <label className="label">Confirm email address</label>
                  <input
                    type="email"
                    className="input"
                    value={confirmEmail}
                    onChange={e => setConfirmEmail(e.target.value)}
                    onPaste={e => e.preventDefault()}
                    placeholder="Re-enter your email"
                    autoComplete="off"
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

                <p className="text-xs text-mid text-center leading-relaxed mt-3">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" target="_blank" className="text-teal font-semibold hover:underline">Terms of Service</Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="text-teal font-semibold hover:underline">Privacy Policy</Link>.
                </p>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-mid">
                  Already have an account?{' '}
                  <Link href="/login" className="text-teal font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
        </div>
      </div>
    </div>
  )
}
