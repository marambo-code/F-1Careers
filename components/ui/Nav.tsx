'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Desktop nav links ─────────────────────────────────────────────

const desktopLinks = [
  { href: '/dashboard',     label: 'Dashboard' },
  { href: '/strategy',      label: 'GC Strategy' },
  { href: '/career-moves',  label: 'Career Moves' },
  { href: '/rfe',           label: 'RFE Analyzer' },
  { href: '/profile',       label: 'Profile' },
]

// ── Bottom tab bar items (mobile only) ────────────────────────────

const tabItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-teal' : 'text-mid'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/career-moves',
    label: 'Moves',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-teal' : 'text-mid'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/strategy',
    label: 'Strategy',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-teal' : 'text-mid'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-teal' : 'text-mid'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

// ── Nav component ─────────────────────────────────────────────────

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      // Fetch subscription + profile name in parallel
      Promise.all([
        supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      ]).then(([subResult, profileResult]) => {
        if (subResult.data?.status === 'active' || subResult.data?.status === 'trialing') {
          setIsPro(true)
        }
        const name = profileResult.data?.full_name
        if (name) setFirstName(name.split(' ')[0])
      })
    })
  }, [pathname])

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ── Top nav (desktop) ──────────────────────────────────── */}
      <nav className="bg-navy border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white font-bold text-lg tracking-tight">F-1 Careers</span>
            <span className="hidden sm:inline text-teal text-xs font-bold bg-teal/15 px-1.5 py-0.5 rounded border border-teal/20">AI</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {desktopLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) ? 'bg-white/10 text-white' : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}>
                {link.label}
              </Link>
            ))}

            {/* Pro badge / upgrade */}
            {isPro ? (
              <span className="ml-1 px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-teal/25 to-teal/15 text-teal border border-teal/30 flex items-center gap-1.5">
                <span>✦</span> Pro Member
              </span>
            ) : (
              <Link href="/subscribe"
                className={`ml-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  isActive('/subscribe') ? 'bg-white/10 text-white' : 'text-teal border border-teal/30 hover:bg-teal/10'
                }`}>
                Pro ✦
              </Link>
            )}
          </div>

          {/* User name + sign out — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {firstName && (
              <span className="text-blue-200 text-sm">Hello, <span className="text-white font-semibold">{firstName}</span></span>
            )}
            <button onClick={handleSignOut} disabled={signingOut}
              className="text-blue-300 hover:text-white text-sm transition-colors disabled:opacity-50">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>

          {/* Mobile: logo area shows Pro badge if Pro */}
          {isPro && (
            <span className="md:hidden text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal/20 text-teal border border-teal/30">
              ✦ Pro
            </span>
          )}
        </div>
      </nav>

      {/* ── Bottom tab bar (mobile only) ───────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex items-stretch h-16">
          {tabItems.map(tab => {
            const active = isActive(tab.href)
            return (
              <Link key={tab.href} href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                  active ? 'text-teal' : 'text-mid'
                }`}>
                {tab.icon(active)}
                <span className={`text-[10px] font-semibold leading-none ${active ? 'text-teal' : 'text-mid'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}

          {/* Sign out tab */}
          <button onClick={handleSignOut} disabled={signingOut}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-mid min-h-[44px]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] font-semibold leading-none">
              {signingOut ? '…' : 'Sign out'}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
