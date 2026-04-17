'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/data/visa-bulletin'
import type { Profile } from '@/lib/types'

const VISA_OPTIONS = ['F-1 CPT', 'F-1 OPT', 'F-1 OPT STEM', 'H-1B', 'H-1B1', 'O-1', 'EB-2 NIW Pending', 'Green Card', 'Other']
const GOAL_OPTIONS = ['First job / internship', 'H-1B sponsorship', 'Green card (EB pathway)', 'Switching employers', 'Other']

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Partial<Profile & { country_of_birth: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Upload resume if selected
    if (resumeFile) {
      setUploading(true)
      const path = `${user.id}/${Date.now()}-${resumeFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(path, resumeFile, { upsert: true })

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
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account')
      // Sign out and redirect to home
      await supabase.auth.signOut()
      router.push('/?deleted=true')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  if (loading) return <div className="text-mid">Loading profile...</div>

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Your Profile</h1>
        <p className="text-mid mt-1">This information is used to personalize your AI strategy reports.</p>
      </div>

      <form onSubmit={handleSave} className="card space-y-6">
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
            <select
              className="input"
              value={profile.country_of_birth ?? ''}
              onChange={e => setProfile(p => ({ ...p, country_of_birth: e.target.value }))}
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-mid mt-1">Used to show visa backlog warnings relevant to your case.</p>
          </div>
        </div>

        <div>
          <label className="label">LinkedIn URL (optional)</label>
          <input className="input" value={profile.linkedin_url ?? ''} onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/yourname" />
        </div>

        <div>
          <label className="label">Resume (PDF)</label>
          {profile.resume_filename && (
            <p className="text-sm text-mid mb-2">Current: <span className="font-medium text-navy">{profile.resume_filename}</span></p>
          )}
          <input
            type="file"
            accept=".pdf"
            onChange={e => setResumeFile(e.target.files?.[0] ?? null)}
            className="text-sm text-mid file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-navy-light file:text-navy file:text-sm file:font-medium hover:file:bg-navy/10 cursor-pointer"
          />
          <p className="text-xs text-mid mt-1">PDF only. Required for Green Card Strategy Report.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving || uploading} className="btn-primary">
            {uploading ? 'Uploading resume...' : saving ? 'Saving...' : 'Save profile'}
          </button>
          {saved && <span className="text-sm text-teal font-medium">✓ Saved</span>}
        </div>
      </form>

      {/* ── Delete Account ──────────────────────────────────────────────────── */}
      <div className="card border border-red-100 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-red-600">Delete Account</h2>
          <p className="text-xs text-mid mt-1 leading-relaxed">
            Permanently deletes your account, all reports, profile data, and cancels any active subscription. This cannot be undone.
          </p>
        </div>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
          >
            Delete my account →
          </button>
        ) : (
          <div className="space-y-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-800">
              Type <span className="font-mono bg-red-100 px-1 rounded">DELETE</span> to confirm
            </p>
            <input
              className="input border-red-300 focus:ring-red-400 font-mono"
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
            />
            {deleteError && (
              <p className="text-xs text-red-600 font-medium">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="text-sm font-bold bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Permanently delete account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                className="text-sm text-mid hover:text-navy transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
