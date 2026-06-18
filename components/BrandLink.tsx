'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/**
 * Brand "home" link for public pages.
 * Rule: the F-1 Careers logo takes a signed-in user to their dashboard,
 * and a visitor to the marketing homepage. Same logo, destination depends
 * on auth state. Defaults to "/" and upgrades to "/dashboard" once the
 * session resolves (no visual change, only the link target).
 */
export default function BrandLink({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [href, setHref] = useState('/')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setHref('/dashboard')
    })
  }, [])

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
