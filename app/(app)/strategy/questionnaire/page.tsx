'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile, VisaStatus, CareerGoal } from '@/lib/types'

// ─── Data ─────────────────────────────────────────────────────────

const STRENGTH = ['None', 'Weak', 'Moderate', 'Strong', 'Exceptional'] as const
const STRENGTH_COLORS = [
  'bg-gray-100 text-gray-500 border-gray-200',
  'bg-orange-50 text-orange-600 border-orange-200',
  'bg-yellow-50 text-yellow-700 border-yellow-200',
  'bg-teal-light text-teal border-teal/30',
  'bg-teal text-white border-teal',
]

const VISA_OPTIONS = ['F-1 CPT', 'F-1 OPT', 'F-1 OPT STEM', 'H-1B', 'H-1B1', 'O-1', 'EB-2 NIW Pending', 'Green Card', 'Other'] as const
const GOAL_OPTIONS = ['First job / internship', 'H-1B sponsorship', 'Green card (EB pathway)', 'Switching employers', 'Other'] as const

function DiffNote({ changed }: { changed: boolean }) {
  if (!changed) return null
  return <p className="text-[11px] text-amber-600 mt-0.5">✎ Changed from your profile — this value is used for this report.</p>
}

const CRITERIA = [
  {
    id: 'awards',
    name: 'Awards & Prizes',
    code: '§204.5(h)(3)(i)',
    desc: 'Receipt of lesser nationally or internationally recognized prizes or awards for excellence in the field.',
    noteLabel: 'List your awards (name, awarding body, year)',
    notePlaceholder: 'e.g. NSF CAREER Award 2022, Best Paper Award NeurIPS 2021, Forbes 30 Under 30 2023',
  },
  {
    id: 'membership',
    name: 'Association Membership',
    code: '§204.5(h)(3)(ii)',
    desc: 'Membership in associations that require outstanding achievement of their members, as judged by recognized national or international experts.',
    noteLabel: null,
    notePlaceholder: null,
  },
  {
    id: 'press',
    name: 'Published Media Coverage',
    code: '§204.5(h)(3)(iii)',
    desc: 'Published material about you in professional publications, major trade publications, or other major media relating to your work.',
    noteLabel: 'List media mentions (outlet, headline, date)',
    notePlaceholder: 'e.g. MIT Technology Review "AI Researcher Making Waves" Dec 2023, TechCrunch interview Jan 2024',
  },
  {
    id: 'judging',
    name: 'Judging the Work of Others',
    code: '§204.5(h)(3)(iv)',
    desc: 'Participation as a judge of the work of others in the field, either individually or on a panel.',
    noteLabel: null,
    notePlaceholder: null,
  },
  {
    id: 'contributions',
    name: 'Original Contributions of Major Significance',
    code: '§204.5(h)(3)(v)',
    desc: 'Original scientific, scholarly, artistic, athletic, or business-related contributions of major significance in the field.',
    noteLabel: 'Describe your most significant contribution and its impact',
    notePlaceholder: 'e.g. Developed X algorithm adopted by 3 Fortune 500 companies; published in Nature with 400+ citations; co-inventor on 2 granted patents',
  },
  {
    id: 'scholarly',
    name: 'Scholarly Articles',
    code: '§204.5(h)(3)(vi)',
    desc: 'Authorship of scholarly articles in professional journals or other major media in the field.',
    noteLabel: 'Publications & citations (count, journals, h-index)',
    notePlaceholder: 'e.g. 12 papers, 340 citations, h-index 8; journals: ICML, NeurIPS, ICLR; 3 first-author papers',
  },
  {
    id: 'display',
    name: 'Artistic Display / Exhibition',
    code: '§204.5(h)(3)(vii)',
    desc: 'Display of your work in the field at artistic exhibitions or showcases (arts fields only).',
    noteLabel: null,
    notePlaceholder: null,
  },
  {
    id: 'critical_role',
    name: 'Critical or Leading Role',
    code: '§204.5(h)(3)(viii)',
    desc: 'Performance in a critical or leading role for distinguished organizations or establishments.',
    noteLabel: 'Describe your critical role and why it is essential',
    notePlaceholder: 'e.g. Tech Lead for 30-person team at Google; sole ML architect for $50M product; named as key person in company\'s O-1 petition',
  },
  {
    id: 'high_salary',
    name: 'High Salary or Remuneration',
    code: '§204.5(h)(3)(ix)',
    desc: 'Command of a high salary or significantly high remuneration compared to others in the field.',
    noteLabel: null,
    notePlaceholder: null,
  },
  {
    id: 'commercial',
    name: 'Commercial Success (Performing Arts)',
    code: '§204.5(h)(3)(x)',
    desc: 'Commercial success in the performing arts (box office receipts, record sales, etc.). Arts fields only.',
    noteLabel: null,
    notePlaceholder: null,
  },
]

const NIW_PRONGS = [
  {
    id: 'prong1',
    label: 'Prong 1, Substantial Merit & National Importance',
    desc: 'Does your proposed endeavor have inherent merit and significance that extends beyond your employer or locality? Is it in an area important to the US (science, tech, education, health, economy, culture)?',
  },
  {
    id: 'prong2',
    label: 'Prong 2, Well-Positioned to Advance the Endeavor',
    desc: 'Does your education, skills, knowledge, record of success, and specific plan position you to successfully advance this endeavor? Do you have a track record that supports this?',
  },
  {
    id: 'prong3',
    label: 'Prong 3, On Balance, Benefit Justifies Waiving Job Offer',
    desc: 'On balance, would it be beneficial to the US to waive the normal labor certification requirement? Does your work\'s national importance outweigh the general US worker protections?',
  },
]

const STEPS = [
  { id: 'background', title: 'Your Background' },
  { id: 'eb1a', title: 'EB-1A Criteria Assessment' },
  { id: 'niw', title: 'EB-2 NIW Analysis' },
  { id: 'context', title: 'Goals & Context' },
]

// ─── Helpers ──────────────────────────────────────────────────────

function CriterionRater({
  value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {STRENGTH.map((s, i) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(i)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            value === i ? STRENGTH_COLORS[i] : 'bg-white text-mid border-border hover:border-navy/30'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs text-red-500 mt-1 font-medium">{msg}</p>
}

// ─── Page ─────────────────────────────────────────────────────────

const defaultAnswers = {
  field_of_work: '',
  subfield: '',
  education_level: '',
  years_in_field: '',
  current_role: '',
  current_employer: '',
  us_salary: '',
  filing_timeline: '',
  work_description: '',
  cr_awards: 0,
  cr_membership: 0,
  cr_press: 0,
  cr_judging: 0,
  cr_contributions: 0,
  cr_scholarly: 0,
  cr_display: 0,
  cr_critical_role: 0,
  cr_high_salary: 0,
  cr_commercial: 0,
  notes_awards: '',
  notes_scholarly: '',
  notes_contributions: '',
  notes_press: '',
  notes_critical_role: '',
  niw_prong1: 2,
  niw_prong2: 2,
  niw_prong3: 2,
  proposed_endeavor: '',
  employer_support: '',
  attorney_consulted: '',
  biggest_concern: '',
}

function QuestionnaireInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editReportId = searchParams.get('edit') // present when editing an existing pending report
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [originalProfile, setOriginalProfile] = useState<Partial<Profile>>({})
  const [saveChangesToProfile, setSaveChangesToProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState(defaultAnswers)
  const [existingRegenCount, setExistingRegenCount] = useState(0)
  const [isPro, setIsPro] = useState(false)
  const [resumeText, setResumeText] = useState<string>('')
  const [visaExpiration, setVisaExpiration] = useState<string>('')
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string>('')
  const [resumeFromProfile, setResumeFromProfile] = useState(false)
  const [linkedInUrl, setLinkedInUrl] = useState<string>('')
  const [jobHistory, setJobHistory] = useState<{ role: string; employer: string; duration: string }[]>([])
  const [showSecondEdu, setShowSecondEdu] = useState(false)
  const [secondEdu, setSecondEdu] = useState({ university: '', degree: '', field: '' })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [draftNotice, setDraftNotice] = useState(false)
  const firstErrorRef = useRef<HTMLDivElement>(null)

  const set = (key: string, val: string | number) => {
    setAnswers(a => ({ ...a, [key]: val }))
    setTouched(t => ({ ...t, [key]: true }))
  }

  // Discard the saved draft and reset to a blank questionnaire.
  const handleStartOver = () => {
    setAnswers(defaultAnswers)
    setStep(0)
    setVisaExpiration('')
    setLinkedInUrl('')
    setJobHistory([])
    setSecondEdu({ university: '', degree: '', field: '' })
    setShowSecondEdu(false)
    setDraftNotice(false)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').update({ strategy_draft: null }).eq('id', user.id).then(() => {})
    })
  }

  // ── Validation ─────────────────────────────────────────────────
  const step0Errors: Record<string, string> = {}
  if (!answers.field_of_work)    step0Errors.field_of_work    = 'Please select your primary field'
  if (!answers.subfield.trim())  step0Errors.subfield          = 'Please enter your specific role or subfield'
  if (!answers.education_level)  step0Errors.education_level   = 'Please select your highest degree'
  if (!answers.work_description.trim()) step0Errors.work_description = 'Please describe your work, this is the core of your petition'

  const step2Errors: Record<string, string> = {}
  if (!answers.proposed_endeavor.trim()) step2Errors.proposed_endeavor = 'Please describe your proposed US endeavor'

  const step0Valid = Object.keys(step0Errors).length === 0
  const step2Valid = Object.keys(step2Errors).length === 0

  const handleContinue = () => {
    if (step === 0 && !step0Valid) {
      // Mark all step-0 required fields as touched so errors show
      setTouched(t => ({ ...t, field_of_work: true, subfield: true, education_level: true, work_description: true }))
      setTimeout(() => firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      return
    }
    if (step === 2 && !step2Valid) {
      setTouched(t => ({ ...t, proposed_endeavor: true }))
      return
    }
    setStep(s => s + 1)
  }

  // ── Resume upload ───────────────────────────────────────────────
  const handleResumeUpload = async (file: File) => {
    setResumeUploading(true)
    setResumeFileName(file.name)
    setResumeFromProfile(false)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const res = await fetch('/api/strategy/parse-resume', { method: 'POST', body: formData })
      if (res.ok) {
        const { text } = await res.json()
        setResumeText(text)
      } else {
        setResumeFileName('')
      }
    } catch {
      setResumeFileName('')
    } finally {
      setResumeUploading(false)
    }
  }

  // ── Load profile + check for existing pending report ────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const [profileRes, reportsRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('reports')
          .select('id, questionnaire_responses, regen_count')
          .eq('user_id', user.id)
          .eq('type', 'strategy')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1),
        supabase.from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .maybeSingle(),
      ])

      setIsPro(!!subRes.data)

      const existingPending = reportsRes.data?.[0]

      // No edit param + existing pending report → redirect to preview
      if (!editReportId && existingPending) {
        router.replace(`/strategy/preview?reportId=${existingPending.id}`)
        return
      }

      // Edit mode: pre-populate answers from saved questionnaire_responses
      if (editReportId && existingPending?.id === editReportId) {
        setExistingRegenCount(existingPending.regen_count ?? 0)
        const saved = existingPending.questionnaire_responses as typeof defaultAnswers | null
        if (saved) {
          setAnswers(prev => ({ ...prev, ...saved }))
          if (saved.proposed_endeavor) { /* already in answers */ }
        }
      }

      const data = profileRes.data
      if (data) {
        setProfile(data)
        setOriginalProfile(data)
        // Prefill role/employer/visa-expiry from profile (fill blanks only,
        // so edit-mode saved answers and in-progress input are preserved).
        setAnswers(a => ({
          ...a,
          current_employer: a.current_employer || (data.current_employer ?? ''),
          current_role: a.current_role || (data.job_title ?? ''),
        }))
        if (data.visa_expiration) setVisaExpiration(prev => prev || (data.visa_expiration ?? ''))
        if (data.linkedin_url) setLinkedInUrl(data.linkedin_url)
        if (data.degree) {
          const d = data.degree.toLowerCase()
          const mapped =
            d.includes('phd') || d.includes('doctorate') || d.includes('doctor of philosophy') ? 'phd' :
            d.includes('m.d.') || d.includes('doctor of medicine') ? 'md' :
            d.includes('master') || d.includes('m.s.') || d.includes('m.a.') || d.includes('mba') ? 'masters' :
            d.includes('bachelor') || d.includes('b.s.') || d.includes('b.a.') || d.includes('b.eng') ? 'bachelors' :
            ''
          if (mapped) setAnswers(a => ({ ...a, education_level: mapped }))
        }

        // Auto-load resume from profile if available
        if (data.resume_path) {
          setResumeUploading(true)
          fetch('/api/strategy/profile-resume')
            .then(r => r.json())
            .then(body => {
              if (body.text) {
                setResumeText(body.text)
                setResumeFileName(body.filename ?? 'resume from profile')
                setResumeFromProfile(true)
              }
            })
            .catch(() => {})
            .finally(() => setResumeUploading(false))
        }

        // Restore an in-progress draft (new report only — if a pending report
        // existed we already redirected to the preview above). Runs after the
        // profile prefill so the user's own saved answers take precedence.
        if (!editReportId && data.strategy_draft) {
          const d = data.strategy_draft as { answers?: Partial<typeof defaultAnswers>; step?: number; visaExpiration?: string; linkedInUrl?: string; jobHistory?: { role: string; employer: string; duration: string }[]; showSecondEdu?: boolean; secondEdu?: { university: string; degree: string; field: string } }
          if (d.answers) setAnswers(a => ({ ...a, ...d.answers }))
          if (typeof d.step === 'number') setStep(d.step)
          if (d.visaExpiration) setVisaExpiration(d.visaExpiration)
          if (d.linkedInUrl) setLinkedInUrl(d.linkedInUrl)
          if (Array.isArray(d.jobHistory)) setJobHistory(d.jobHistory)
          if (d.secondEdu) { setSecondEdu(d.secondEdu); setShowSecondEdu(!!d.showSecondEdu) }
          setDraftNotice(true)
        }
      }
      setLoading(false)
    })
  }, [editReportId])

  // Autosave the in-progress questionnaire so a user can leave and resume later.
  // New reports only; debounced 1.5s; skips the initial empty/prefill state.
  useEffect(() => {
    if (editReportId || loading) return
    const meaningful = step > 0 || !!answers.field_of_work || !!answers.subfield.trim() ||
      !!answers.work_description.trim() || !!answers.proposed_endeavor.trim()
    if (!meaningful) return
    const t = setTimeout(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase.from('profiles').update({
          strategy_draft: { answers, step, visaExpiration, linkedInUrl, jobHistory, showSecondEdu, secondEdu, savedAt: new Date().toISOString() },
        }).eq('id', user.id).then(() => {})
      })
    }, 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, step, visaExpiration, linkedInUrl, jobHistory, showSecondEdu, secondEdu])

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!step0Valid) { setError('Please go back and fill in all required fields.'); return }
    if (!step2Valid) { setError('Please describe your proposed US endeavor on Step 3.'); return }

    // Regen cap: free users get 1 edit after their initial preview
    if (editReportId && !isPro && existingRegenCount >= 1) {
      setError('Free members can update their preview once. Upgrade to Pro to regenerate unlimited times.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in.'); setSubmitting(false); return }

      const allAnswers = {
        ...answers,
        full_name: profile.full_name ?? '',
        university: profile.university ?? '',
        degree: profile.degree ?? '',
        field_of_study: profile.field_of_study ?? '',
        graduation_date: profile.graduation_date ?? '',
        visa_status: profile.visa_status ?? answers.field_of_work,
        career_goal: profile.career_goal ?? '',
        ...(resumeText ? { resume_text: resumeText } : {}),
        ...(visaExpiration ? { visa_expiration: visaExpiration } : {}),
        ...(linkedInUrl ? { linkedin_url: linkedInUrl } : {}),
        ...(jobHistory.length > 0 ? { job_history: jobHistory.filter(j => j.role && j.employer) } : {}),
        ...(showSecondEdu && secondEdu.university ? {
          second_university: secondEdu.university,
          second_degree: secondEdu.degree,
          second_field_of_study: secondEdu.field,
        } : {}),
      }

      // ── Write shared identity fields back to the profile ──────────
      // Blanks fill automatically; an already-set value is only overwritten
      // when the user opted in. Empties are never written. Non-fatal.
      try {
        const wb: { col: string; next: string; orig: string }[] = [
          { col: 'full_name',        next: (profile.full_name ?? '') as string,      orig: (originalProfile.full_name ?? '') as string },
          { col: 'visa_status',      next: (profile.visa_status ?? '') as string,    orig: (originalProfile.visa_status ?? '') as string },
          { col: 'university',       next: (profile.university ?? '') as string,     orig: (originalProfile.university ?? '') as string },
          { col: 'degree',           next: (profile.degree ?? '') as string,         orig: (originalProfile.degree ?? '') as string },
          { col: 'field_of_study',   next: (profile.field_of_study ?? '') as string, orig: (originalProfile.field_of_study ?? '') as string },
          { col: 'career_goal',      next: (profile.career_goal ?? '') as string,    orig: (originalProfile.career_goal ?? '') as string },
          { col: 'current_employer', next: answers.current_employer ?? '',           orig: (originalProfile.current_employer ?? '') as string },
          { col: 'job_title',        next: answers.current_role ?? '',               orig: (originalProfile.job_title ?? '') as string },
          { col: 'visa_expiration',  next: visaExpiration ?? '',                     orig: (originalProfile.visa_expiration ?? '') as string },
          { col: 'linkedin_url',     next: linkedInUrl ?? '',                        orig: (originalProfile.linkedin_url ?? '') as string },
        ]
        const updates: Record<string, string> = {}
        for (const f of wb) {
          if (!f.next) continue              // never write empties
          if (!f.orig) updates[f.col] = f.next                                    // fill a blank automatically
          else if (f.next !== f.orig && saveChangesToProfile) updates[f.col] = f.next  // overwrite only if opted in
        }
        if (Object.keys(updates).length) {
          await supabase.from('profiles').update(updates).eq('id', user.id)
        }
      } catch { /* report still proceeds */ }

      let reportId: string

      if (editReportId) {
        // Edit mode: update existing report and increment regen count
        const { error: updateError } = await supabase
          .from('reports')
          .update({
            questionnaire_responses: allAnswers,
            regen_count: existingRegenCount + 1,
            preview_data: null, // clear old preview while regenerating
          })
          .eq('id', editReportId)

        if (updateError) {
          setError(`Could not update your responses: ${updateError.message}`)
          setSubmitting(false)
          return
        }
        reportId = editReportId
      } else {
        // New report
        const { data: report, error: insertError } = await supabase
          .from('reports')
          .insert({ user_id: user.id, type: 'strategy', status: 'pending', questionnaire_responses: allAnswers })
          .select().single()

        if (insertError || !report) {
          setError(`Could not save your responses: ${insertError?.message ?? 'Unknown error'}`)
          setSubmitting(false)
          return
        }
        reportId = report.id
      }

      const res = await fetch('/api/strategy/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, answers: allAnswers }),
      })

      if (res.ok) {
        // Clear the saved draft — it's now a submitted report.
        supabase.from('profiles').update({ strategy_draft: null }).eq('id', user.id).then(() => {})
        router.push(`/strategy/preview?reportId=${reportId}`)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(`Generation failed: ${body?.error ?? res.statusText}. Please try again.`)
        setSubmitting(false)
      }
    } catch (e: unknown) {
      setError(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-mid">Loading...</div>

  const crKeys = ['cr_awards','cr_membership','cr_press','cr_judging','cr_contributions',
    'cr_scholarly','cr_display','cr_critical_role','cr_high_salary','cr_commercial'] as const
  const metCount = crKeys.filter(k => (answers[k] as number) >= 2).length

  // Bachelor's / Other = no second degree needed (user already stated highest degree)
  const showAddSecondDegree = !['bachelors', 'other', ''].includes(answers.education_level)

  // Helper: should we show inline error for a field?
  const err = (field: string, errors: Record<string, string>) =>
    touched[field] ? errors[field] : undefined

  return (
    <div className="max-w-3xl space-y-6">

      {/* Edit mode banner */}
      {editReportId && (
        <div className="flex items-center justify-between bg-teal/8 border border-teal/20 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-bold text-navy">Editing your saved responses</p>
            <p className="text-xs text-mid mt-0.5">
              {!isPro && existingRegenCount >= 1
                ? 'You have used your free re-generation. Upgrade to Pro to regenerate again.'
                : !isPro
                ? `Free members can regenerate their preview once. You have ${1 - existingRegenCount} remaining.`
                : 'Pro member — unlimited regenerations.'}
            </p>
          </div>
          <Link href={`/strategy/preview?reportId=${editReportId}`} className="text-xs text-teal font-semibold hover:underline flex-shrink-0 ml-4">
            Back to preview →
          </Link>
        </div>
      )}

      {draftNotice && (
        <div className="rounded-xl bg-teal/8 border border-teal/20 p-3 flex items-start justify-between gap-3">
          <p className="text-sm text-navy"><span className="font-semibold">Welcome back —</span> we saved your progress and restored your answers.</p>
          <button type="button" onClick={handleStartOver} className="text-xs text-mid hover:text-red-600 underline flex-shrink-0 mt-0.5">Start over</button>
        </div>
      )}

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-navy">Green Card Strategy Questionnaire</h1>
          <span className="text-sm text-mid">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-teal' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-sm font-semibold text-navy mt-2">{STEPS[step].title}</p>
        {step === 1 && (
          <p className="text-xs text-mid mt-0.5">
            Rate each EB-1A criterion based on your current evidence. You need ≥ 3 criteria at Moderate or above.
            {' '}<span className={`font-semibold ${metCount >= 3 ? 'text-teal' : 'text-orange-600'}`}>
              Currently meeting: {metCount}/3+ required
            </span>
          </p>
        )}
      </div>

      {/* ── STEP 1: Background ── */}
      {step === 0 && (
        <div className="card space-y-5">

          {/* Profile data — prefilled and editable. Edits always flow into this
              report; tick the box to also save them back to your profile. */}
          <div className="bg-teal-light rounded-xl p-4 space-y-3 border border-teal/20">
            <div>
              <p className="text-sm font-bold text-teal">Your profile — prefilled below</p>
              <p className="text-xs text-teal/70 mt-0.5">Edit anything that should be different for this report. What you enter here is always used in your report.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={profile.full_name ?? ''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
                <DiffNote changed={(profile.full_name ?? '') !== (originalProfile.full_name ?? '') && !!originalProfile.full_name} />
              </div>
              <div>
                <label className="label">Visa status</label>
                <select className="input" value={profile.visa_status ?? ''} onChange={e => setProfile(p => ({ ...p, visa_status: (e.target.value || null) as VisaStatus | null }))}>
                  <option value="">Select…</option>
                  {VISA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <DiffNote changed={(profile.visa_status ?? '') !== (originalProfile.visa_status ?? '') && !!originalProfile.visa_status} />
              </div>
              <div>
                <label className="label">University</label>
                <input className="input" value={profile.university ?? ''} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} placeholder="e.g. The Wharton School" />
                <DiffNote changed={(profile.university ?? '') !== (originalProfile.university ?? '') && !!originalProfile.university} />
              </div>
              <div>
                <label className="label">Highest degree</label>
                <input className="input" value={profile.degree ?? ''} onChange={e => setProfile(p => ({ ...p, degree: e.target.value }))} placeholder="MBA, PhD, MS…" />
                <DiffNote changed={(profile.degree ?? '') !== (originalProfile.degree ?? '') && !!originalProfile.degree} />
              </div>
              <div>
                <label className="label">Field of study</label>
                <input className="input" value={profile.field_of_study ?? ''} onChange={e => setProfile(p => ({ ...p, field_of_study: e.target.value }))} placeholder="e.g. AI for Business" />
                <DiffNote changed={(profile.field_of_study ?? '') !== (originalProfile.field_of_study ?? '') && !!originalProfile.field_of_study} />
              </div>
              <div>
                <label className="label">Career goal</label>
                <select className="input" value={profile.career_goal ?? ''} onChange={e => setProfile(p => ({ ...p, career_goal: (e.target.value || null) as CareerGoal | null }))}>
                  <option value="">Select…</option>
                  {GOAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <DiffNote changed={(profile.career_goal ?? '') !== (originalProfile.career_goal ?? '') && !!originalProfile.career_goal} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-navy/80 cursor-pointer pt-0.5">
              <input type="checkbox" checked={saveChangesToProfile} onChange={e => setSaveChangesToProfile(e.target.checked)} className="rounded border-border" />
              Also save these edits to my profile <span className="text-mid">(blank fields are saved automatically)</span>
            </label>
          </div>

          {/* Field + Subfield */}
          <div ref={firstErrorRef} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Field of Work <span className="text-red-500">*</span></label>
              <select
                className={`input ${touched.field_of_work && step0Errors.field_of_work ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={answers.field_of_work}
                onChange={e => set('field_of_work', e.target.value)}
              >
                <option value="">Select your field</option>
                <option value="stem_cs">STEM, Computer Science / AI / Software</option>
                <option value="stem_bio">STEM, Biology / Biotech / Life Sciences</option>
                <option value="stem_phys">STEM, Physics / Chemistry / Materials</option>
                <option value="stem_eng">STEM, Engineering (non-software)</option>
                <option value="medicine">Medicine / Healthcare / Clinical Research</option>
                <option value="business">Business / Finance / Economics</option>
                <option value="arts">Arts / Film / Design / Music / Architecture</option>
                <option value="sports">Athletics / Sports</option>
                <option value="education">Education / Social Sciences / Policy</option>
                <option value="law">Law / Government / Policy</option>
                <option value="other">Other</option>
              </select>
              <FieldError msg={err('field_of_work', step0Errors)} />
            </div>
            <div>
              <label className="label">Specific Role / Subfield <span className="text-red-500">*</span></label>
              <input
                className={`input ${touched.subfield && step0Errors.subfield ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={answers.subfield}
                onChange={e => set('subfield', e.target.value)}
                placeholder="e.g. NLP research, oncology drug discovery, fintech"
              />
              <FieldError msg={err('subfield', step0Errors)} />
            </div>
          </div>

          {/* Education + Years */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Highest Degree Earned <span className="text-red-500">*</span></label>
              <select
                className={`input ${touched.education_level && step0Errors.education_level ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={answers.education_level}
                onChange={e => {
                  set('education_level', e.target.value)
                  // If switching to bachelors/other, close second degree panel
                  if (['bachelors', 'other'].includes(e.target.value)) setShowSecondEdu(false)
                }}
              >
                <option value="">Select</option>
                <option value="phd">PhD / Doctorate</option>
                <option value="md">MD / Medical Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="other">Other / None</option>
              </select>
              <FieldError msg={err('education_level', step0Errors)} />
            </div>
            <div>
              <label className="label">Total Years in This Field</label>
              <select className="input" value={answers.years_in_field} onChange={e => set('years_in_field', e.target.value)}>
                <option value="">Select</option>
                <option value="1">Less than 1 year</option>
                <option value="3">1–3 years</option>
                <option value="6">3–6 years</option>
                <option value="11">6–11 years</option>
                <option value="16">11+ years</option>
              </select>
            </div>
          </div>

          {/* Role + Employer */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Role / Title</label>
              <input className="input" value={answers.current_role} onChange={e => set('current_role', e.target.value)} placeholder="Software Engineer, PhD Researcher, Attending Physician..." />
            </div>
            <div>
              <label className="label">Current Employer</label>
              <input className="input" value={answers.current_employer} onChange={e => set('current_employer', e.target.value)} placeholder="Google, Mass General Hospital, Self-employed..." />
            </div>
          </div>

          {/* Salary + Timeline */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Annual US Salary (USD)</label>
              <input className="input" value={answers.us_salary} onChange={e => set('us_salary', e.target.value)} placeholder="e.g. $140,000" />
            </div>
            <div>
              <label className="label">Target Filing Timeline</label>
              <select className="input" value={answers.filing_timeline} onChange={e => set('filing_timeline', e.target.value)}>
                <option value="">Select</option>
                <option value="3">Within 3 months</option>
                <option value="6">3–6 months</option>
                <option value="12">6–12 months</option>
                <option value="18">12–18 months</option>
              </select>
            </div>
          </div>

          {/* Work description */}
          <div>
            <label className="label">
              Describe Your Work & Its Significance <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-mid mb-1.5">
              What do you actually do? What makes it significant? Who benefits? Be as specific as possible, this is the core of your petition narrative.
            </p>
            <textarea
              className={`input ${touched.work_description && step0Errors.work_description ? 'border-red-400 focus:ring-red-300' : ''}`}
              rows={5}
              value={answers.work_description}
              onChange={e => set('work_description', e.target.value)}
              placeholder="e.g. I develop large language model alignment techniques at Anthropic. My research on constitutional AI has been adopted by 3 major AI labs and cited 400+ times. My work directly reduces AI safety risks that are a stated national priority in the Executive Order on AI (Oct 2023)..."
            />
            <FieldError msg={err('work_description', step0Errors)} />
          </div>

          {/* Resume Upload */}
          <div>
            <label className="label">
              Upload Resume / CV <span className="text-teal text-xs font-semibold ml-1">Highly Recommended</span>
            </label>
            <p className="text-xs text-mid mb-2">
              Uploading your resume dramatically improves report quality, the AI will extract specific evidence, cite real accomplishments, and draft petition language using your actual experience.
            </p>

            {/* Profile resume banner */}
            {resumeFromProfile && resumeText && !resumeUploading && (
              <div className="mb-2 flex items-center gap-2 bg-teal-light border border-teal/20 rounded-xl px-4 py-2.5">
                <span className="text-teal text-sm">✓</span>
                <p className="text-sm text-teal font-semibold flex-1">Resume loaded from your profile, <span className="font-normal">{resumeFileName}</span></p>
                <span className="text-xs text-teal/60">Upload below to replace</span>
              </div>
            )}

            <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-colors ${
              resumeText ? 'border-teal bg-teal-light' : 'border-border bg-gray-50 hover:border-teal/40'
            }`}>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f) }}
              />
              {resumeUploading ? (
                <span className="flex items-center gap-2 text-sm text-mid">
                  <svg className="animate-spin w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {resumeFromProfile ? 'Loading resume from profile...' : 'Parsing resume...'}
                </span>
              ) : resumeText ? (
                <span className="flex items-center gap-2 text-sm text-teal font-semibold">
                  <span>✓</span> {resumeFileName}
                  <span className="font-normal text-mid ml-1">(click to replace)</span>
                </span>
              ) : (
                <span className="text-sm text-mid">
                  <span className="text-teal font-semibold">Click to upload</span> your resume PDF (max 10MB)
                </span>
              )}
            </label>
          </div>

          {/* Visa Expiration */}
          <div>
            <label className="label">Current Visa / Status Expiration Date</label>
            <p className="text-xs text-mid mb-1.5">Helps calculate your filing urgency and OPT/STEM deadlines precisely.</p>
            <input
              type="month"
              className="input max-w-xs"
              value={visaExpiration}
              onChange={e => setVisaExpiration(e.target.value)}
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="label">LinkedIn URL <span className="text-teal text-xs font-semibold ml-1">Recommended</span></label>
            <p className="text-xs text-mid mb-1.5">Helps identify stronger recommenders and context for your expert letter strategy.</p>
            <input
              className="input"
              value={linkedInUrl}
              onChange={e => setLinkedInUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
            />
          </div>

          {/* Second Degree, only shown for PhD, MD, Master's */}
          {showAddSecondDegree && (
            <div>
              {!showSecondEdu ? (
                <button
                  type="button"
                  onClick={() => setShowSecondEdu(true)}
                  className="text-sm text-teal font-semibold hover:underline"
                >
                  + Add undergraduate / second degree
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">Second Degree</label>
                    <button type="button" onClick={() => setShowSecondEdu(false)} className="text-xs text-mid hover:text-red-500">Remove</button>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input className="input" placeholder="University" value={secondEdu.university} onChange={e => setSecondEdu(s => ({ ...s, university: e.target.value }))} />
                    <input className="input" placeholder="Degree (e.g. B.S.)" value={secondEdu.degree} onChange={e => setSecondEdu(s => ({ ...s, degree: e.target.value }))} />
                    <input className="input" placeholder="Field of study" value={secondEdu.field} onChange={e => setSecondEdu(s => ({ ...s, field: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Previous Roles */}
          <div className="space-y-3">
            <div>
              <label className="label mb-0">Previous Roles</label>
              <p className="text-xs text-mid mt-0.5">Prior employers, significantly improves evidence mapping and recommender identification.</p>
            </div>
            {jobHistory.map((job, i) => (
              <div key={i} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-[1fr_1fr_auto_auto] sm:gap-2 sm:items-center">
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <input className="input text-sm" placeholder="Role / Title" value={job.role} onChange={e => setJobHistory(h => h.map((j, idx) => idx === i ? { ...j, role: e.target.value } : j))} />
                  <input className="input text-sm" placeholder="Employer" value={job.employer} onChange={e => setJobHistory(h => h.map((j, idx) => idx === i ? { ...j, employer: e.target.value } : j))} />
                </div>
                <div className="flex gap-2 sm:contents">
                  <input className="input text-sm flex-1 sm:w-24" placeholder="2021–23" value={job.duration} onChange={e => setJobHistory(h => h.map((j, idx) => idx === i ? { ...j, duration: e.target.value } : j))} />
                  <button type="button" onClick={() => setJobHistory(h => h.filter((_, idx) => idx !== i))} className="text-mid hover:text-red-500 text-lg leading-none px-2 flex-shrink-0">×</button>
                </div>
              </div>
            ))}
            {jobHistory.length < 4 && (
              <button
                type="button"
                onClick={() => setJobHistory(h => [...h, { role: '', employer: '', duration: '' }])}
                className="text-sm text-teal font-semibold hover:underline"
              >
                + Add previous role
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: EB-1A Criteria ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card bg-navy-light border-navy/10 text-sm text-mid leading-relaxed">
            <strong className="text-navy">How to rate:</strong> For each criterion, select the level that honestly reflects your current evidence.
            {' '}EB-1A requires meeting <strong className="text-navy">at least 3 of these 10 criteria</strong> at a credible level. USCIS evaluates quality, not just quantity.
          </div>

          {CRITERIA.map((c, idx) => {
            const crKey = `cr_${c.id}` as keyof typeof answers
            const noteKey = c.noteLabel ? `notes_${c.id === 'critical_role' ? 'critical_role' : c.id}` as keyof typeof answers : null
            const val = answers[crKey] as number

            return (
              <div key={c.id} className={`card space-y-3 ${val >= 2 ? 'border-teal/30' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-navy text-sm">{idx + 1}. {c.name}</span>
                      <span className="text-xs text-mid font-mono bg-gray-100 px-2 py-0.5 rounded">{c.code}</span>
                      {val >= 2 && (
                        <span className="text-xs bg-teal-light text-teal font-semibold px-2 py-0.5 rounded-full">✓ Meets threshold</span>
                      )}
                    </div>
                    <p className="text-xs text-mid mt-1 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
                <CriterionRater
                  label={c.name}
                  value={val}
                  onChange={v => set(crKey, v)}
                />
                {noteKey && c.noteLabel && val > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-navy">{c.noteLabel} <span className="font-normal text-mid">(optional but improves your results)</span></label>
                    <textarea
                      className="input mt-1 text-sm"
                      rows={2}
                      value={answers[noteKey] as string}
                      onChange={e => set(noteKey, e.target.value)}
                      placeholder={c.notePlaceholder ?? ''}
                    />
                  </div>
                )}
              </div>
            )
          })}

          <div className={`card text-sm font-semibold flex items-center gap-3 ${metCount >= 3 ? 'bg-teal-light border-teal/20 text-teal' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
            <span className="text-2xl">{metCount >= 3 ? '✅' : '⚠️'}</span>
            <span>
              {metCount >= 3
                ? `${metCount} criteria at Moderate or above, meets EB-1A threshold`
                : `${metCount} of 3+ required criteria at Moderate or above, gaps will be addressed in your report`}
            </span>
          </div>
        </div>
      )}

      {/* ── STEP 3: NIW ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="card bg-navy-light border-navy/10 text-sm text-mid leading-relaxed">
            <strong className="text-navy">EB-2 NIW, Dhanasar Analysis.</strong>{' '}
            The National Interest Waiver lets you self-petition without a job offer if your work benefits the US. USCIS uses the <em>Matter of Dhanasar</em> three-prong test. Rate each prong honestly.
          </div>

          {NIW_PRONGS.map((p, idx) => {
            const key = `niw_${p.id}` as keyof typeof answers
            const val = answers[key] as number
            return (
              <div key={p.id} className="card space-y-3">
                <div>
                  <span className="font-bold text-navy text-sm">{p.label}</span>
                  <p className="text-xs text-mid mt-1 leading-relaxed">{p.desc}</p>
                </div>
                <CriterionRater label={p.label} value={val} onChange={v => set(key, v)} />
                <p className="text-xs text-mid">
                  Current: <span className={`font-semibold ${val >= 3 ? 'text-teal' : val >= 2 ? 'text-yellow-700' : 'text-orange-600'}`}>{STRENGTH[val]}</span>
                  {val === 0 && ', Significant gap; this prong needs development before filing'}
                  {val === 1 && ', Weak; needs strengthening to meet USCIS standard'}
                  {val === 2 && ', Arguable; a strong petition brief could support this'}
                  {val === 3 && ', Strong; well-supported for this prong'}
                  {val === 4 && ', Exceptional; compelling case for this prong'}
                </p>
              </div>
            )
          })}

          <div className="card space-y-2">
            <label className="label">
              Your Proposed US Endeavor <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-mid">
              Describe specifically what you will do in the US and why it is of national importance.
              Be concrete, mention the field, the problem you are solving, and why the US benefits.
            </p>
            <textarea
              className={`input ${touched.proposed_endeavor && step2Errors.proposed_endeavor ? 'border-red-400 focus:ring-red-300' : ''}`}
              rows={5}
              value={answers.proposed_endeavor}
              onChange={e => set('proposed_endeavor', e.target.value)}
              placeholder="e.g. I will continue developing novel immunotherapy protocols targeting treatment-resistant pancreatic cancer at Memorial Sloan Kettering. My research addresses a cancer with a 5-year survival rate of 12%, which the NIH has identified as a priority area..."
            />
            <FieldError msg={err('proposed_endeavor', step2Errors)} />
          </div>
        </div>
      )}

      {/* ── STEP 4: Context ── */}
      {step === 3 && (
        <div className="card space-y-5">
          <div>
            <label className="label">Would your current employer write a support letter for a visa petition?</label>
            <select className="input" value={answers.employer_support} onChange={e => set('employer_support', e.target.value)}>
              <option value="">Select</option>
              <option value="Yes, would write support letter">Yes, they would write a support letter</option>
              <option value="Possibly, need to ask">Possibly, haven't asked yet</option>
              <option value="No / Not applicable">No / Not applicable</option>
              <option value="Self-employed / own company">Self-employed / own company</option>
            </select>
          </div>

          <div>
            <label className="label">Have you worked with an immigration attorney?</label>
            <select className="input" value={answers.attorney_consulted} onChange={e => set('attorney_consulted', e.target.value)}>
              <option value="">Select</option>
              <option value="Yes, currently working with one">Yes, currently working with one</option>
              <option value="Yes, in the past">Yes, consulted in the past</option>
              <option value="No, but interested">No, but interested</option>
              <option value="No, prefer to self-file">No, prefer to self-file</option>
            </select>
          </div>

          <div>
            <label className="label">What is the #1 question or concern you need this report to answer?</label>
            <textarea
              className="input"
              rows={4}
              value={answers.biggest_concern}
              onChange={e => set('biggest_concern', e.target.value)}
              placeholder="e.g. I'm not sure if I have enough evidence for EB-1A vs NIW, which should I pursue first? Or: My OPT expires in 8 months and I need a path that doesn't require employer sponsorship..."
            />
          </div>

          {/* Summary preview */}
          <div className="bg-gray-50 border border-border rounded-xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-navy mb-2">Review before generating</p>
            <p className="text-mid"><span className="text-navy font-medium">Field:</span> {answers.field_of_work || '—'} {answers.subfield ? `(${answers.subfield})` : ''}</p>
            <p className="text-mid"><span className="text-navy font-medium">Education:</span> {answers.education_level || '—'}{answers.years_in_field ? `, ${answers.years_in_field}yr experience` : ''}</p>
            <p className="text-mid">
              <span className="text-navy font-medium">EB-1A criteria met:</span>{' '}
              <span className={metCount >= 3 ? 'text-teal font-semibold' : 'text-orange-600 font-semibold'}>{metCount}/10 at Moderate+</span>
            </p>
            <p className="text-mid">
              <span className="text-navy font-medium">NIW prongs:</span>{' '}
              {STRENGTH[answers.niw_prong1]} / {STRENGTH[answers.niw_prong2]} / {STRENGTH[answers.niw_prong3]}
            </p>
            <p className="text-mid">
              <span className="text-navy font-medium">Resume:</span>{' '}
              {resumeText
                ? <span className="text-teal font-semibold">✓ {resumeFileName}</span>
                : <span className="text-orange-600">Not uploaded, report will be less specific</span>
              }
            </p>
            {visaExpiration && (
              <p className="text-mid"><span className="text-navy font-medium">Visa expires:</span> {visaExpiration}</p>
            )}
          </div>

          {/* Missing required fields warning */}
          {(!step0Valid || !step2Valid) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
              <p className="font-semibold mb-1">⚠️ Missing required information</p>
              <ul className="space-y-0.5 text-xs">
                {!answers.field_of_work && <li>• Primary field of work (Step 1)</li>}
                {!answers.subfield.trim() && <li>• Specific role / subfield (Step 1)</li>}
                {!answers.education_level && <li>• Highest degree earned (Step 1)</li>}
                {!answers.work_description.trim() && <li>• Work description (Step 1)</li>}
                {!answers.proposed_endeavor.trim() && <li>• Proposed US endeavor (Step 3)</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="btn-outline disabled:opacity-30"
        >
          ← Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={handleContinue}
            className="btn-primary"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-teal px-8 disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing your profile...
              </span>
            ) : editReportId ? 'Regenerate my preview →' : 'Generate my preview →'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div className="text-mid text-sm">Loading...</div>}>
      <QuestionnaireInner />
    </Suspense>
  )
}
