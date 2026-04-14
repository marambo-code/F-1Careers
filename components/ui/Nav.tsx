'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavLink { href: string; label: string; highlight?: boolean }

const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/strategy', label: 'Green Card Strategy' },
  { href: '/rfe', label: 'RFE Analyzer' },
  { href: '/profile', label: 'Profile' },
  { href: '/subscribe', label: 'Pro', highlight: true },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-navy border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white font-bold text-lg tracking-tight">F-1 Careers</span>
          <span className="hidden sm:inline text-teal text-xs font-bold bg-teal/15 px-1.5 py-0.5 rounded border border-teal/20">
            AI
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(link => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            if (link.highlight && !isActive) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold text-teal border border-teal/30 hover:bg-teal/10 transition-colors ml-1"
                >
                  {link.label} ✦
                </Link>
              )
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-blue-300 hover:text-white text-sm transition-colors disabled:opacity-50"
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/10 px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
        {navLinks.map(link => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                link.highlight && !isActive
                  ? 'text-teal border border-teal/30 font-bold'
                  : isActive
                  ? 'bg-white/10 text-white'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              {link.label}{link.highlight && !isActive ? ' ✦' : ''}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
