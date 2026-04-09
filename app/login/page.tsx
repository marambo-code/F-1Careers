import { Suspense } from 'react'
import LoginForm from './LoginForm'

// Server component — Suspense here satisfies Next.js 15 prerender requirement
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
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
          <h1 className="text-xl font-bold text-navy mb-1">Welcome back</h1>
          <p className="text-sm text-mid mb-6">Sign in to access your career strategy dashboard.</p>
          <Suspense fallback={<div className="h-48 animate-pulse bg-gray-50 rounded-lg" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          Not your account?{' '}
          <a href="https://f1careers.com" className="underline hover:text-white transition-colors">
            Back to f1careers.com
          </a>
        </p>
      </div>
    </div>
  )
}
