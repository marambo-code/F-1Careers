'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

// ─── Data ─────────────────────────────────────────────────────────

const STRENGTH = ['None', 'Weak', 'Moderate', 'Strong', 'Exceptional'] as const
const STRENGTH_COLORS = [
  'bg-gray-100 text-gray-500 border-gray-200',
  'bg-orange-50 text-orange-600 border-orange-200',
  'bg-yellow-50 text-yellow-700 border-yellow-200',
  'bg-teal-light text-teal border-teal/30',
  'bg-teal text-white border-teal',
]

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
    label: 'Prong 1 — Substantial Merit & National Importance',
    desc: 'Does your proposed endeavor have inherent merit and significance that extends beyond your employer or locality? Is it in an area important to the US (science, tech, education, health, economy, culture)?',
  },
  {
    id: 'prong2',
    label: 'Prong 2 — Well-Positioned to Advance the Endeavor',
    desc: 'Does your education, skills, knowledge, record of success, and specific plan position you to successfully advance this endeavor? Do you have a track record that supports this?',
  },
  {
    id: 'prong3',
    label: 'Prong 3 — On Balance, Benefit Justifies Waiving Job Offer',
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
  label, value, onChange,
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

export default function QuestionnairePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState(defaultAnswers)
  const [resumeText, setResumeText] = useState<string>('')
  const [visaExpiration, setVisaExpiration] = useState<string>('')
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeFileName, setResumeFileName] = useState<string>('')

  const set = (key: string, val: string | number) =>
    setAnswers(a => ({ ...a, [key]: val }))

  const handleResumeUpload = async (file: File) => {
    setResumeUploading(true)
    setResumeFileName(file.name)
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data)
          // Pre-populate education_level from profile.degree if not already set
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
        }
        setLoading(false)
      })
    })
  }, [])

  const handleSubmit = async () => {
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
      }

      const { data: report, error: insertError } = await supabase
        .from('reports')
        .insert({ user_id: user.id, type: 'strategy', status: 'pending', questionnaire_responses: allAnswers })
        .select().single()

      if (insertError || !report) {
        setError(`Could not save your responses: ${insertError?.message ?? 'Unknown error'}`)
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/strategy/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id, answers: allAnswers }),
      })

      if (res.ok) {
        router.push(`/strategy/preview?reportId=${report.id}`)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(`AI generation failed: ${body?.error ?? res.statusText}. Please try again.`)
        setSubmitting(false)
      }
    } catch (e: unknown) {
      setError(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-mid">Loading...</div>

  // ── Count met EB-1A criteria (rating ≥ 2 = meets threshold) ──
  const crKeys = ['cr_awards','cr_membership','cr_press','cr_judging','cr_contributions',
    'cr_scholarly','cr_display','cr_critical_role','cr_high_salary','cr_commercial'] as const
  const metCount = crKeys.filter(k => (answers[k] as number) >= 2).length

  return (
    <div className="max-w-2xl space-y-8">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-navy">Career Strategy Questionnaire</h1>
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
          {(profile.full_name || profile.visa_status) && (
            <div className="bg-teal-light rounded-xl p-4 space-y-2 border border-teal/20">
              <p className="text-sm font-bold text-teal">✓ Profile data loaded — automatically included in your report</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                {profile.full_name    && <p><span className="text-teal/60">Name:</span> <span className="text-navy font-medium">{profile.full_name}</span></p>}
                {profile.visa_status  && <p><span className="text-teal/60">Visa status:</span> <span className="text-navy font-medium">{profile.visa_status}</span></p>}
                {profile.university   && <p><span className="text-teal/60">University:</span> <span className="text-navy font-medium">{profile.university}</span></p>}
                {profile.degree       && <p><span className="text-teal/60">Degree:</span> <span className="text-navy font-medium">{profile.degree}</span></p>}
                {profile.field_of_study && <p><span className="text-teal/60">Field of study:</span> <span className="text-navy font-medium">{profile.field_of_study}</span></p>}
                {profile.career_goal  && <p><span className="text-teal/60">Career goal:</span> <span className="text-navy font-medium">{profile.career_goal}</span></p>}
              </div>
              <p className="text-xs text-teal/60">Fill in the fields below — the more detail you add, the more specific your report will be.</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Field of Work <span className="text-red-500">*</span></label>
              <select className="input" value={answers.field_of_work} onChange={e => set('field_of_work', e.target.value)}>
                <option value="">Select your field</option>
                <option value="stem_cs">STEM — Computer Science / AI / Software</option>
                <option value="stem_bio">STEM — Biology / Biotech / Life Sciences</option>
                <option value="stem_phys">STEM — Physics / Chemistry / Materials</option>
                <option value="stem_eng">STEM — Engineering (non-software)</option>
                <option value="medicine">Medicine / Healthcare / Clinical Research</option>
                <option value="business">Business / Finance / Economics</option>
                <option value="arts">Arts / Film / Design / Music / Architecture</option>
                <option value="sports">Athletics / Sports</option>
                <option value="education">Education / Social Sciences / Policy</option>
                <option value="law">Law / Government / Policy</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Specific Role / Subfield <span className="text-red-500">*</span></label>
              <input
                className="input"
                value={answers.subfield}
                onChange={e => set('subfield', e.target.value)}
                placeholder="e.g. NLP research, oncology drug discovery, fintech"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Highest Degree Earned <span className="text-red-500">*</span></label>
              <select className="input" value={answers.education_level} onChange={e => set('education_level', e.target.value)}>
                <option value="">Select</option>
                <option value="phd">PhD / Doctorate</option>
                <option value="md">MD / Medical Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="other">Other / None</option>
              </select>
            </div>
            <div>
              <label className="label">Total Years in This Field <span className="text-red-500">*</span></label>
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

          <div>
            <label className="label">
              Describe Your Work & Its Significance <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-mid mb-1.5">
              What do you actually do? What makes it significant? Who benefits? Be as specific as possible — this is the core of your petition narrative.
            </p>
            <textarea
              className="input"
              rows={5}
              value={answers.work_description}
              onChange={e => set('work_description', e.target.value)}
              placeholder="e.g. I develop large language model alignment techniques at Anthropic. My research on constitutional AI has been adopted by 3 major AI labs and cited 400+ times. My work directly reduces AI safety risks that are a stated national priority in the Executive Order on AI (Oct 2023)..."
            />
          </div>

          {/* Resume Upload */}
          <div>
            <label className="label">
              Upload Resume / CV <span className="text-teal text-xs font-semibold ml-1">Highly Recommended</span>
            </label>
            <p className="text-xs text-mid mb-2">
              Uploading your resume dramatically improves report quality — the AI will extract specific evidence, cite real accomplishments, and draft petition language using your actual experience.
            </p>
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
                  Parsing resume...
                </span>
              ) : resumeText ? (
                <span className="flex items-center gap-2 text-sm text-teal font-semibold">
                  <span>✓</span> {resumeFileName} — parsed successfully
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
              placeholder="YYYY-MM"
            />
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
                    <label className="text-xs font-semibold text-navy">{c.noteLabel} <span className="font-normal text-mid">(optional but improves AI accuracy)</span></label>
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
                ? `${metCount} criteria at Moderate or above — meets EB-1A threshold`
                : `${metCount} of 3+ required criteria at Moderate or above — gaps will be addressed in your report`}
            </span>
          </div>
        </div>
      )}

      {/* ── STEP 3: NIW ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="card bg-navy-light border-navy/10 text-sm text-mid leading-relaxed">
            <strong className="text-navy">EB-2 NIW — Dhanasar Analysis.</strong>{' '}
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
                  {val === 0 && ' — Significant gap; this prong needs development before filing'}
                  {val === 1 && ' — Weak; needs strengthening to meet USCIS standard'}
                  {val === 2 && ' — Arguable; a strong attorney brief could support this'}
                  {val === 3 && ' — Strong; well-supported for this prong'}
                  {val === 4 && ' — Exceptional; compelling case for this prong'}
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
              Be concrete — mention the field, the problem you are solving, and why the US benefits.
            </p>
            <textarea
              className="input"
              rows={5}
              value={answers.proposed_endeavor}
              onChange={e => set('proposed_endeavor', e.target.value)}
              placeholder="e.g. I will continue developing novel immunotherapy protocols targeting treatment-resistant pancreatic cancer at Memorial Sloan Kettering. My research addresses a cancer with a 5-year survival rate of 12%, which the NIH has identified as a priority area. My specific expertise in KRAS inhibitor combination therapy is not available from any current US-trained researcher in this niche..."
            />
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
              <option value="Yes, would write support letter">Yes — they would write a support letter</option>
              <option value="Possibly, need to ask">Possibly — haven't asked yet</option>
              <option value="No / Not applicable">No / Not applicable</option>
              <option value="Self-employed / own company">Self-employed / own company</option>
            </select>
          </div>

          <div>
            <label className="label">Have you worked with an immigration attorney?</label>
            <select className="input" value={answers.attorney_consulted} onChange={e => set('attorney_consulted', e.target.value)}>
              <option value="">Select</option>
              <option value="Yes, currently working with one">Yes — currently working with one</option>
              <option value="Yes, in the past">Yes — consulted in the past</option>
              <option value="No, but interested">No — but interested</option>
              <option value="No, prefer to self-file">No — prefer to self-file</option>
            </select>
          </div>

          <div>
            <label className="label">What is the #1 question or concern you need this report to answer?</label>
            <textarea
              className="input"
              rows={4}
              value={answers.biggest_concern}
              onChange={e => set('biggest_concern', e.target.value)}
              placeholder="e.g. I'm not sure if I have enough evidence for EB-1A vs NIW — which should I pursue first? Or: My OPT expires in 8 months and I need a path that doesn't require employer sponsorship..."
            />
          </div>

          {/* Summary preview before submit */}
          <div className="bg-gray-50 border border-border rounded-xl p-4 space-y-1 text-sm">
            <p className="font-semibold text-navy mb-2">Review before generating</p>
            <p className="text-mid"><span className="text-navy font-medium">Field:</span> {answers.field_of_work || '—'} {answers.subfield ? `(${answers.subfield})` : ''}</p>
            <p className="text-mid"><span className="text-navy font-medium">Education:</span> {answers.education_level || '—'}, {answers.years_in_field ? `${answers.years_in_field}yr experience` : '—'}</p>
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
                ? <span className="text-teal font-semibold">✓ {resumeFileName} uploaded</span>
                : <span className="text-orange-600">Not uploaded — report will be less specific</span>
              }
            </p>
            {visaExpiration && (
              <p className="text-mid"><span className="text-navy font-medium">Visa expires:</span> {visaExpiration}</p>
            )}
          </div>
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
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && (!answers.field_of_work || !answers.subfield || !answers.work_description)}
            className="btn-primary disabled:opacity-50"
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
            ) : 'Generate my preview →'}
          </button>
        )}
      </div>
    </div>
  )
}
