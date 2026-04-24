'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/data/visa-bulletin'
import type { Profile } from '@/lib/types'

const VISA_OPTIONS = ['F-1 CPT', 'F-1 OPT', 'F-1 OPT STEM', 'H-1B', 'H-1B1', 'O-1', 'EB-2 NIW Pending', 'Green Card', 'Other']
const GOAL_OPTIONS = ['First job / internship', 'H-1B sponsorship', 'Green card (EB pathway)', 'Switching employers', 'Other']

// ── Searchable country combobox ───────────────────────────────────────────────
function CountryCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (code: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Display name for current value
  const displayName = COUNTRIES.find(c => c.code === value)?.name ?? ''

  // Show query while typing, otherwise show selected name
  const inputValue = open ? query : displayName

  const filtered = query.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          className="input pr-8"
          placeholder="Search country…"
          value={inputValue}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          autoComplete="off"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mid pointer-events-none text-xs">
          {open ? '▲' : '▼'}
        </span>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-mid">No countries found</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.code}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-navy-light transition-colors ${c.code === value ? 'bg-teal/8 text-teal font-medium' : 'text-navy'}`}
                onMouseDown={e => {
                  e.preventDefault()
                  onChange(c.code)
                  setOpen(false)
                  setQuery('')
                }}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function completionFields(profile: Partial<Profile & { country_of_birth: string; current_employer: string; job_title: string }>): { filled: number; total: number; missing: string[] } {
  const checks: [string, unknown][] = [
    ['Full name', profile.full_name],
    ['Most recent university', profile.university],
    ['Highest degree', profile.degree],
    ['Field of study', profile.field_of_study],
    ['Graduation date', profile.graduation_date],
    ['Visa status', profile.visa_status],
    ['Career goal', profile.career_goal],
    ['Country of birth', profile.country_of_birth],
    ['LinkedIn URL', profile.linkedin_url],
    ['Resume', profile.resume_filename],
  ]
  const filled = checks.filter(([, v]) => !!v).length
  const missing = checks.filter(([, v]) => !v).map(([k]) => k)
  return { filled, total: checks.length, missing }
}

// ── Inner component ──────────────────────────────────────────────────────────

function ProfileContent() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const isWelcome = params.get('welcome') === 'true'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Partial<Profile & { country_of_birth: string; current_employer: string; job_title: string }>>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [subscription, setSubscription] = useState<{
    status: string
    cancel_at_period_end: boolean
    current_period_end: string | null
  } | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? null)
      const [profileRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('status, cancel_at_period_end, current_period_end').eq('user_id', user.id).maybeSingle(),
      ])
      if (profileRes.data) setProfile(profileRes.data)
      if (subRes.data) setSubscription(subRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (resumeFile) {
      setUploading(true)
      const path = `${user.id}/${Date.now()}-${resumeFile.name}`
      const { error: uploadError } = await supabase.storage.from('resumes').upload(path, resumeFile, { upsert: true })
      if (!uploadError) {
        profile.resume_path = path
        profile.resume_filename = resumeFile.name
      }
      setUploading(false)
    }

    await supabase.from('profiles').update({ ...profile, updated_at: new Date().toISOString() }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    if (isWelcome) setTimeout(() => router.push('/dashboard'), 800)
  }

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSubscription(prev => prev ? { ...prev, cancel_at_period_end: data.cancel_at_period_end } : prev)
        setCancelConfirm(false)
      }
    } finally {
      setCancelling(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account')
      await supabase.auth.signOut()
      router.push('/?deleted=true')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') setResumeFile(file)
  }

  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing'
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const completion = completionFields(profile)
  const completionPct = Math.round((completion.filled / completion.total) * 100)

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-navy-light" />
        <div className="h-64 rounded-2xl bg-navy-light" />
        <div className="h-48 rounded-2xl bg-navy-light" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      {isWelcome && (
        <div className="rounded-2xl bg-teal/8 border border-teal/20 p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-teal/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-lg">👋</div>
          <div>
            <p className="font-bold text-navy">Welcome to F-1 Careers!</p>
            <p className="text-sm text-mid mt-1 leading-relaxed">
              Fill out your profile — the AI uses this to personalize your green card strategy.
            </p>
            <p className="text-xs text-mid mt-2">
              Already set up?{' '}
              <Link href="/dashboard" className="text-teal font-semibold hover:underline">Go to dashboard →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Profile header card ─────────────────────────────────────────── */}
      <div className="card !p-0 overflow-hidden">
        {/* Top gradient strip */}
        <div className="h-2 bg-gradient-to-r from-teal via-teal/70 to-navy" />

        <div className="p-6 flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center flex-shrink-0 text-white text-xl font-bold shadow-sm">
            {getInitials(profile.full_name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-navy truncate">
                {profile.full_name || 'Your Profile'}
              </h1>
              {isPro && (
                <span className="inline-flex items-center gap-1 bg-teal/12 text-teal border border-teal/25 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
                  ✦ Pro Member
                </span>
              )}
            </div>
            <p className="text-sm text-mid mt-0.5 truncate">{userEmail}</p>
            {profile.university && profile.field_of_study && (
              <p className="text-xs text-mid mt-1">{profile.field_of_study} · {profile.university}</p>
            )}
          </div>

          {/* Completion ring */}
          <div className="flex-shrink-0 text-center hidden sm:block">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-navy-light" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - completionPct / 100)}`}
                  strokeLinecap="round"
                  className={completionPct >= 80 ? 'text-teal' : completionPct >= 50 ? 'text-yellow-400' : 'text-orange-400'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-navy">{completionPct}%</span>
              </div>
            </div>
            <p className="text-[10px] text-mid mt-1 font-medium">Complete</p>
          </div>
        </div>

        {/* Completion bar + hint */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-mid font-medium">Profile completeness</span>
            <span className="text-xs text-mid">{completion.filled}/{completion.total} fields</span>
          </div>
          <div className="h-1.5 rounded-full bg-navy-light overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completionPct >= 80 ? 'bg-teal' : completionPct >= 50 ? 'bg-yellow-400' : 'bg-orange-400'}`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {completion.missing.length > 0 && completionPct < 100 && (
            <p className="text-[11px] text-mid mt-1.5">
              Missing: {completion.missing.slice(0, 3).join(', ')}{completion.missing.length > 3 ? ` + ${completion.missing.length - 3} more` : ''}
            </p>
          )}
        </div>
      </div>

      {/* ── Profile form ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-5">

        {/* Personal info */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center text-sm">👤</div>
            <div>
              <h2 className="text-sm font-bold text-navy">Personal Info</h2>
              <p className="text-[11px] text-mid">Your basic details</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={profile.full_name ?? ''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Evelyn Manyatta" />
            </div>
            <div>
              <label className="label">Country of Birth</label>
              <CountryCombobox
                value={profile.country_of_birth ?? ''}
                onChange={code => setProfile(p => ({ ...p, country_of_birth: code }))}
              />
              <p className="text-[11px] text-mid mt-1">Used for visa backlog warnings</p>
            </div>
          </div>

          <div>
            <label className="label">LinkedIn URL <span className="text-mid font-normal">(optional)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mid text-sm">🔗</span>
              <input className="input pl-8" value={profile.linkedin_url ?? ''} onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/yourname" />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center text-sm">🎓</div>
            <div>
              <h2 className="text-sm font-bold text-navy">Education</h2>
              <p className="text-[11px] text-mid">Academic background</p>
            </div>
          </div>

          <p className="text-[11px] text-mid -mt-1">Enter your most recent or highest degree — the one most relevant to your green card pathway.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Most Recent University</label>
              <input className="input" value={profile.university ?? ''} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} placeholder="The Wharton School" />
            </div>
            <div>
              <label className="label">Highest Degree</label>
              <input className="input" value={profile.degree ?? ''} onChange={e => setProfile(p => ({ ...p, degree: e.target.value }))} placeholder="MBA, PhD, MS…" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Field of Study</label>
              <input className="input" value={profile.field_of_study ?? ''} onChange={e => setProfile(p => ({ ...p, field_of_study: e.target.value }))} placeholder="AI for Business" />
            </div>
            <div>
              <label className="label">Graduation Date</label>
              <input type="date" className="input" value={profile.graduation_date ?? ''} onChange={e => setProfile(p => ({ ...p, graduation_date: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Immigration status */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center text-sm">🛂</div>
            <div>
              <h2 className="text-sm font-bold text-navy">Immigration & Career</h2>
              <p className="text-[11px] text-mid">Current status and goals</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Visa Status</label>
              <select className="input" value={profile.visa_status ?? ''} onChange={e => setProfile(p => ({ ...p, visa_status: e.target.value as Profile['visa_status'] }))}>
                <option value="">Select status</option>
                {VISA_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Career Goal</label>
              <select className="input" value={profile.career_goal ?? ''} onChange={e => setProfile(p => ({ ...p, career_goal: e.target.value as Profile['career_goal'] }))}>
                <option value="">Select goal</option>
                {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Employer <span className="text-mid font-normal">(optional)</span></label>
              <input className="input" value={profile.current_employer ?? ''} onChange={e => setProfile(p => ({ ...p, current_employer: e.target.value }))} placeholder="Google, self-employed, N/A…" />
            </div>
            <div>
              <label className="label">Job Title <span className="text-mid font-normal">(optional)</span></label>
              <input className="input" value={profile.job_title ?? ''} onChange={e => setProfile(p => ({ ...p, job_title: e.target.value }))} placeholder="Software Engineer, Researcher…" />
            </div>
          </div>
          <p className="text-[11px] text-mid -mt-1">Already working? These help the AI tailor your green card strategy to your current role.</p>
        </div>

        {/* Resume */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center text-sm">📄</div>
            <div>
              <h2 className="text-sm font-bold text-navy">Resume</h2>
              <p className="text-[11px] text-mid">Required for Green Card Strategy reports</p>
            </div>
          </div>

          {/* Current resume pill */}
          {(profile.resume_filename || resumeFile) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal/6 border border-teal/20 rounded-xl">
              <span className="text-teal text-sm">✓</span>
              <span className="text-sm text-navy font-medium truncate">{resumeFile?.name ?? profile.resume_filename}</span>
              {resumeFile && (
                <button type="button" onClick={() => setResumeFile(null)} className="ml-auto text-mid hover:text-navy text-xs flex-shrink-0">Remove</button>
              )}
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${dragOver ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => setResumeFile(e.target.files?.[0] ?? null)}
            />
            <div className="text-3xl mb-2">{dragOver ? '📂' : '📁'}</div>
            <p className="text-sm font-medium text-navy">
              {profile.resume_filename && !resumeFile ? 'Upload a new resume' : 'Drop your PDF here'}
            </p>
            <p className="text-xs text-mid mt-1">or click to browse · PDF only</p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving || uploading} className="btn-primary px-8">
            {uploading ? 'Uploading…' : saving ? 'Saving…' : isWelcome ? 'Save and continue →' : 'Save profile'}
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-teal font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {isWelcome ? 'Saved — taking you to dashboard…' : 'Changes saved'}
            </div>
          )}
        </div>
      </form>

      {/* ── Subscription card ────────────────────────────────────────────── */}
      {isPro && subscription ? (
        <div className="card !p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal to-teal/40" />
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-navy">Pro Membership</span>
                  <span className="inline-flex items-center gap-1 bg-teal/12 text-teal border border-teal/25 text-[11px] font-bold px-2.5 py-0.5 rounded-full">✦ Active</span>
                </div>
                {subscription.cancel_at_period_end ? (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    Cancels {periodEnd} — your access continues until then
                  </p>
                ) : (
                  <p className="text-xs text-mid mt-1">Next renewal: {periodEnd}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-navy">$29<span className="text-sm font-normal text-mid">/mo</span></p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-100">
              {['Unlimited reports', 'Career moves', 'RFE analyzer'].map(feature => (
                <div key={feature} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[11px] text-mid">{feature}</span>
                </div>
              ))}
            </div>

            {!cancelConfirm ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-mid">Questions? <a href="mailto:support@f1careers.com" className="text-teal hover:underline">Contact support</a></p>
                {subscription.cancel_at_period_end ? (
                  <button onClick={handleCancelSubscription} disabled={cancelling}
                    className="text-xs text-teal font-semibold hover:underline disabled:opacity-50 transition-colors">
                    {cancelling ? 'Updating…' : 'Reactivate subscription'}
                  </button>
                ) : (
                  <button onClick={() => setCancelConfirm(true)}
                    className="text-xs text-mid hover:text-red-600 transition-colors">
                    Cancel subscription
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-orange-900">Cancel your Pro membership?</p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  You'll lose access to unlimited reports, career moves, and RFE analysis. Your access continues until {periodEnd}.
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={handleCancelSubscription} disabled={cancelling}
                    className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
                    {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                  <button onClick={() => setCancelConfirm(false)}
                    className="text-xs text-mid hover:text-navy transition-colors">
                    Never mind
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : !isPro ? (
        <div className="card !p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-navy to-navy/60" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-navy">Upgrade to Pro</p>
                <p className="text-xs text-mid mt-1">Unlock unlimited strategy reports, career move planning, and RFE analysis.</p>
              </div>
              <p className="text-lg font-bold text-navy flex-shrink-0">$29<span className="text-sm font-normal text-mid">/mo</span></p>
            </div>
            <Link href="/pricing" className="mt-4 inline-flex items-center gap-2 btn-primary text-sm">
              Upgrade now →
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── Account section ──────────────────────────────────────────────── */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3 pb-1 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center text-sm">⚙️</div>
          <div>
            <h2 className="text-sm font-bold text-navy">Account</h2>
            <p className="text-[11px] text-mid">Sign in and security</p>
          </div>
        </div>

        {userEmail && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy truncate">{profile.full_name || 'Your account'}</p>
              <p className="text-[11px] text-mid truncate">{userEmail}</p>
            </div>
            <span className="ml-auto text-[10px] text-mid bg-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">Signed in</span>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-red-600 mb-2">Danger zone</p>
          <p className="text-xs text-mid mb-3 leading-relaxed">
            Permanently removes your account, all reports, and cancels your subscription. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button type="button" onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-mid hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg">
              Delete my account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-red-800">
                Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-xs">DELETE</span> to confirm
              </p>
              <input className="input border-red-200 font-mono text-sm" placeholder="DELETE"
                value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} autoComplete="off" />
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
              <div className="flex gap-3 items-center">
                <button type="button" onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="text-xs font-bold bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {deleting ? 'Deleting…' : 'Permanently delete'}
                </button>
                <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                  className="text-xs text-mid hover:text-navy transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// ── Page wrapper ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-gray-100" />
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
