'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/data/visa-bulletin'
import type { Profile } from '@/lib/types'

const VISA_OPTIONS = ['F-1 CPT', 'F-1 OPT', 'F-1 OPT STEM', 'H-1B', 'H-1B1', 'O-1', 'EB-2 NIW Pending', 'Green Card', 'Other']
const GOAL_OPTIONS = ['First job / internship', 'H-1B sponsorship', 'Green card (EB pathway)', 'Switching employers', 'Other']

// ── Inner component (uses useSearchParams — must be inside Suspense) ──

function ProfileContent() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const isWelcome = params.get('welcome') === 'true'

  const [profile, setProfile] = useState<Partial<Profile & { country_of_birth: string }>>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Subscription state
  const [subscription, setSubscription] = useState<{
    status: string
    cancel_at_period_end: boolean
    current_period_end: string | null
  } | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Danger zone state
  const [showDangerZone, setShowDangerZone] = useState(false)
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
        supabase.from('subscriptions')
          .select('status, cancel_at_period_end, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle(),
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
      const { error: uploadError } = await supabase.storage
        .from('resumes').upload(path, resumeFile, { upsert: true })
      if (!uploadError) {
        profile.resume_path = path
        profile.resume_filename = resumeFile.name
      }
      setUploading(false)
    }

    await supabase.from('profiles').update({
      ...profile,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    // After first save from welcome flow, go to dashboard
    if (isWelcome) {
      setTimeout(() => router.push('/dashboard'), 800)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSubscription(prev => prev ? { ...prev, cancel_at_period_end: data.cancel_at_period_end } : prev)
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

  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing'
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  if (loading) return <div className="text-mid py-8">Loading profile…</div>

  return (
    <div className="max-w-2xl space-y-8">

      {/* ── Welcome banner (new users only) ─────────────────────── */}
      {isWelcome && (
        <div className="rounded-2xl bg-teal/8 border border-teal/20 p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-teal/15 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-teal text-lg">👋</span>
          </div>
          <div>
            <p className="font-bold text-navy">Welcome to F-1 Careers!</p>
            <p className="text-sm text-mid mt-1 leading-relaxed">
              Fill out your profile below — the AI uses this to personalize your green card strategy. Takes 2 minutes.
            </p>
            <p className="text-xs text-mid mt-2">
              Already set up?{' '}
              <Link href="/dashboard" className="text-teal font-semibold hover:underline">Go to dashboard →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────── */}
      {!isWelcome && (
        <div>
          <h1 className="text-2xl font-bold text-navy">Your Profile</h1>
          <p className="text-mid mt-1 text-sm">Used to personalize your AI strategy reports.</p>
        </div>
      )}

      {/* ── Profile form ─────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="card space-y-6">

        {isWelcome && (
          <div>
            <h2 className="text-base font-bold text-navy">Set up your profile</h2>
            <p className="text-xs text-mid mt-0.5">The more you fill in, the better your AI reports.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profile.full_name ?? ''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Priya Sharma" />
          </div>
          <div>
            <label className="label">University</label>
            <input className="input" value={profile.university ?? ''} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} placeholder="Carnegie Mellon University" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Degree</label>
            <input className="input" value={profile.degree ?? ''} onChange={e => setProfile(p => ({ ...p, degree: e.target.value }))} placeholder="Master of Science" />
          </div>
          <div>
            <label className="label">Field of Study</label>
            <input className="input" value={profile.field_of_study ?? ''} onChange={e => setProfile(p => ({ ...p, field_of_study: e.target.value }))} placeholder="Computer Science" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Graduation Date</label>
            <input type="date" className="input" value={profile.graduation_date ?? ''} onChange={e => setProfile(p => ({ ...p, graduation_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Current Visa Status</label>
            <select className="input" value={profile.visa_status ?? ''} onChange={e => setProfile(p => ({ ...p, visa_status: e.target.value as Profile['visa_status'] }))}>
              <option value="">Select status</option>
              {VISA_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Career Goal</label>
            <select className="input" value={profile.career_goal ?? ''} onChange={e => setProfile(p => ({ ...p, career_goal: e.target.value as Profile['career_goal'] }))}>
              <option value="">Select goal</option>
              {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Country of Birth</label>
            <select className="input" value={profile.country_of_birth ?? ''} onChange={e => setProfile(p => ({ ...p, country_of_birth: e.target.value }))}>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <p className="text-xs text-mid mt-1">Used for visa backlog warnings.</p>
          </div>
        </div>

        <div>
          <label className="label">LinkedIn URL <span className="text-mid font-normal">(optional)</span></label>
          <input className="input" value={profile.linkedin_url ?? ''} onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/yourname" />
        </div>

        <div>
          <label className="label">Resume (PDF) <span className="text-mid font-normal">(optional)</span></label>
          {profile.resume_filename && (
            <p className="text-sm text-mid mb-2">Current: <span className="font-medium text-navy">{profile.resume_filename}</span></p>
          )}
          <input type="file" accept=".pdf" onChange={e => setResumeFile(e.target.files?.[0] ?? null)}
            className="text-sm text-mid file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-navy-light file:text-navy file:text-sm file:font-medium hover:file:bg-navy/10 cursor-pointer" />
          <p className="text-xs text-mid mt-1">Required for Green Card Strategy Report.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving || uploading} className="btn-primary">
            {uploading ? 'Uploading…' : saving ? 'Saving…' : isWelcome ? 'Save and continue →' : 'Save profile'}
          </button>
          {saved && <span className="text-sm text-teal font-medium">✓ Saved{isWelcome ? ' — taking you to your dashboard…' : ''}</span>}
        </div>
      </form>

      {/* ── Subscription management ──────────────────────────────── */}
      {isPro && subscription && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy flex items-center gap-2">
                <span className="text-[11px] bg-teal/15 text-teal border border-teal/25 font-bold px-2 py-0.5 rounded-full">✦ Pro</span>
                Active membership
              </p>
              {subscription.cancel_at_period_end ? (
                <p className="text-xs text-orange-600 mt-1">
                  Cancels {periodEnd} — access continues until then
                </p>
              ) : (
                <p className="text-xs text-mid mt-1">
                  Renews {periodEnd}
                </p>
              )}
            </div>
          </div>

          {subscription.cancel_at_period_end ? (
            <button onClick={handleCancelSubscription} disabled={cancelling}
              className="text-xs text-teal font-semibold hover:underline disabled:opacity-50">
              {cancelling ? 'Updating…' : 'Undo cancellation — resume subscription'}
            </button>
          ) : (
            <button onClick={handleCancelSubscription} disabled={cancelling}
              className="text-xs text-mid hover:text-navy transition-colors disabled:opacity-50">
              {cancelling ? 'Updating…' : 'Cancel subscription'}
            </button>
          )}
        </div>
      )}

      {/* ── Manage account (collapsed danger zone) ──────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="flex items-center gap-2 text-xs text-mid hover:text-navy transition-colors"
        >
          <span className={`transition-transform duration-200 ${showDangerZone ? 'rotate-90' : ''}`}>›</span>
          Manage account
        </button>

        {showDangerZone && (
          <div className="mt-4 space-y-5 pl-4 border-l-2 border-gray-100">

            {/* Account info */}
            {userEmail && (
              <div>
                <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-1">Signed in as</p>
                <p className="text-sm text-navy">{userEmail}</p>
              </div>
            )}

            {/* Delete account */}
            <div>
              <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-2">Delete account</p>
              <p className="text-xs text-mid mb-3 leading-relaxed">
                Permanently removes your account, all reports, and cancels your subscription. Cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button type="button" onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-mid hover:text-red-600 transition-colors underline underline-offset-2">
                  Delete my account
                </button>
              ) : (
                <div className="space-y-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-800">
                    Type <span className="font-mono bg-red-100 px-1 rounded">DELETE</span> to confirm
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
        )}
      </div>

    </div>
  )
}

// ── Page wrapper (Suspense required for useSearchParams in Next.js 15) ──

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-mid py-8">Loading profile…</div>}>
      <ProfileContent />
    </Suspense>
  )
}
