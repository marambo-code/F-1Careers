'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PETITION_TYPES = [
  { value: 'eb1a',    label: 'EB-1A',    sub: 'Extraordinary Ability' },
  { value: 'eb2niw',  label: 'EB-2 NIW', sub: 'National Interest Waiver' },
  { value: 'eb1b',    label: 'EB-1B',    sub: 'Outstanding Researcher / Professor' },
  { value: 'o1',      label: 'O-1A/B',   sub: 'Temporary Extraordinary Ability' },
  { value: 'eb2perm', label: 'EB-2/3',   sub: 'PERM Labor Certification' },
  { value: 'h1b',     label: 'H-1B',     sub: 'Specialty Occupation' },
  { value: 'other',   label: 'Other',    sub: 'Unsure / Other petition type' },
]

const FIELD_OPTIONS = [
  { value: 'stem',      label: 'STEM',         icon: '⚗️' },
  { value: 'medicine',  label: 'Medicine',      icon: '🏥' },
  { value: 'business',  label: 'Business',      icon: '📊' },
  { value: 'arts',      label: 'Arts & Design', icon: '🎨' },
  { value: 'sports',    label: 'Athletics',     icon: '🏆' },
  { value: 'law',       label: 'Law / Policy',  icon: '⚖️' },
  { value: 'education', label: 'Education',     icon: '📚' },
  { value: 'other',     label: 'Other',         icon: '🔹' },
]

const STEPS = [
  { n: 1, label: 'Petition type' },
  { n: 2, label: 'Your field' },
  { n: 3, label: 'Upload RFE' },
  { n: 4, label: 'Context' },
]

export default function RFEUploadPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [petitionType, setPetitionType] = useState('')
  const [rfeField, setRfeField] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [additionalContext, setAdditionalContext] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Prefill petition type & field from the user's profile (both stay editable).
  // Only pre-selects on a clear signal; the user can change either at will.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('visa_status, field_of_study').eq('id', user.id).single()
      if (!data) return

      const v = (data.visa_status ?? '').toLowerCase()
      const petition =
        v.includes('niw') ? 'eb2niw' :
        v.includes('o-1') ? 'o1' :
        v.includes('h-1b') ? 'h1b' : ''
      if (petition) setPetitionType(prev => prev || petition)

      const f = (data.field_of_study ?? '').toLowerCase()
      const field =
        /comput|software|\bai\b|data|engineer|physic|chem|bio|math|science|stem/.test(f) ? 'stem' :
        /medic|health|clinical|nurs|pharma/.test(f) ? 'medicine' :
        /business|financ|econ|\bmba\b|market|account/.test(f) ? 'business' :
        /art|design|music|film|architect|fashion/.test(f) ? 'arts' :
        /sport|athlet/.test(f) ? 'sports' :
        /law|legal|policy|govern/.test(f) ? 'law' :
        /educat|teach|pedagog/.test(f) ? 'education' : ''
      if (field) setRfeField(prev => prev || field)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFile = (f: File | undefined) => {
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20MB.'); return }
    setError('')
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !petitionType || !rfeField) return
    setUploading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setUploading(false); return }

    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('rfe-documents')
      .upload(path, file)

    if (uploadError) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const rfeAnswers = { petition_type: petitionType, rfe_field: rfeField, additional_context: additionalContext }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        type: 'rfe',
        status: 'pending',
        rfe_document_path: path,
        questionnaire_responses: rfeAnswers,
      })
      .select()
      .single()

    if (reportError || !report) {
      setError('Failed to create report. Please try again.')
      setUploading(false)
      return
    }

    const res = await fetch('/api/rfe/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: report.id, storagePath: path, petitionType, rfeField, additionalContext }),
    })

    if (res.ok) {
      router.push(`/rfe/preview?reportId=${report.id}`)
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body?.error ?? 'Analysis failed, please try again.')
      setUploading(false)
    }
  }

  const selectedPetition = PETITION_TYPES.find(p => p.value === petitionType)
  const selectedField = FIELD_OPTIONS.find(f => f.value === rfeField)

  const canAdvance = (
    (step === 1 && !!petitionType) ||
    (step === 2 && !!rfeField) ||
    (step === 3 && !!file) ||
    step === 4
  )

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-navy-light rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xs font-black text-navy uppercase tracking-widest">RFE Analyzer</span>
        </div>
        <h1 className="text-2xl font-black text-navy">Respond to your RFE with confidence</h1>
        <p className="text-mid mt-1.5 text-sm leading-relaxed">
          Upload your USCIS Request for Evidence. Get a risk-ranked, issue-by-issue response strategy, formatted to hand directly to your attorney.
        </p>
      </div>

      {/* ── What is an RFE ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900">Don't miss your RFE deadline</p>
          <p className="text-sm text-amber-800 mt-0.5 leading-relaxed">
            RFEs have strict deadlines (typically 87 days). Missing it or responding incorrectly results in automatic denial. We analyze your RFE and tell you exactly what USCIS is asking for and how to respond.
          </p>
        </div>
      </div>

      {/* ── Step indicator ─────────────────────────────────────────── */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step > s.n ? 'bg-teal text-white' :
                step === s.n ? 'bg-navy text-white' :
                'bg-gray-100 text-mid'
              }`}>
                {step > s.n ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : s.n}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${step === s.n ? 'text-navy' : 'text-mid'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${step > s.n ? 'bg-teal' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step content ───────────────────────────────────────────── */}

      {/* Step 1: Petition type */}
      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy">What type of petition is your RFE for?</h2>
            <p className="text-xs text-mid mt-0.5">This determines which USCIS criteria we evaluate against.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PETITION_TYPES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPetitionType(p.value)}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  petitionType === p.value
                    ? 'border-navy bg-navy/[0.03]'
                    : 'border-border hover:border-navy/30 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className={`text-sm font-black ${petitionType === p.value ? 'text-navy' : 'text-navy'}`}>{p.label}</p>
                  {petitionType === p.value && (
                    <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs text-mid mt-1">{p.sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Field */}
      {step === 2 && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy">What&apos;s your field?</h2>
            <p className="text-xs text-mid mt-0.5">Helps us calibrate evidence standards and cite field-relevant benchmarks.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIELD_OPTIONS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setRfeField(f.value)}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  rfeField === f.value
                    ? 'border-teal bg-teal/[0.03]'
                    : 'border-border hover:border-teal/30 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{f.icon}</span>
                    <p className={`text-sm font-bold ${rfeField === f.value ? 'text-teal' : 'text-navy'}`}>{f.label}</p>
                  </div>
                  {rfeField === f.value && (
                    <div className="w-5 h-5 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Upload */}
      {step === 3 && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy">Upload your RFE document</h2>
            <p className="text-xs text-mid mt-0.5">Upload the full RFE PDF exactly as received from USCIS. Max 20MB.</p>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              dragOver ? 'border-teal bg-teal/5 scale-[1.01]' :
              file ? 'border-teal bg-teal/[0.02]' :
              'border-border hover:border-navy/30 hover:bg-gray-50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('rfe-upload')?.click()}
          >
            <input type="file" accept=".pdf" onChange={e => handleFile(e.target.files?.[0])} className="hidden" id="rfe-upload" />
            {file ? (
              <div>
                <div className="w-12 h-12 bg-teal/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-navy">{file.name}</p>
                <p className="text-sm text-mid mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                <p className="text-xs text-teal font-semibold mt-2">Click to change file</p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-bold text-navy">Drop your RFE PDF here</p>
                <p className="text-sm text-mid mt-1">or click to browse</p>
                <p className="text-xs text-mid mt-1">PDF only · Max 20MB</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-mid flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-mid">Private & secure, your document is never shared and processed only to generate your analysis.</p>
          </div>
        </div>
      )}

      {/* Step 4: Context + review */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Summary of selections */}
          <div className="card bg-gray-50/80 border border-border space-y-3">
            <p className="text-xs font-black text-navy uppercase tracking-widest">Your selections</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-mid font-semibold uppercase tracking-wide">Petition</p>
                <p className="font-bold text-navy mt-0.5">{selectedPetition?.label}</p>
                <p className="text-xs text-mid">{selectedPetition?.sub}</p>
              </div>
              <div>
                <p className="text-[11px] text-mid font-semibold uppercase tracking-wide">Field</p>
                <p className="font-bold text-navy mt-0.5">{selectedField?.icon} {selectedField?.label}</p>
              </div>
              <div>
                <p className="text-[11px] text-mid font-semibold uppercase tracking-wide">Document</p>
                <p className="font-bold text-navy mt-0.5 truncate text-xs">{file?.name}</p>
                <p className="text-xs text-mid">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ''}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-teal font-semibold hover:underline"
            >
              ← Change selections
            </button>
          </div>

          {/* Additional context */}
          <div className="card space-y-3">
            <div>
              <label className="text-sm font-bold text-navy">Additional context <span className="text-mid font-normal text-xs">(optional but improves accuracy)</span></label>
              <p className="text-xs text-mid mt-0.5">
                Previous denials, arguments USCIS made, evidence already submitted, your attorney&apos;s initial read.
              </p>
            </div>
            <textarea
              className="input"
              rows={4}
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. This is a second RFE on my EB-1A petition. The first RFE was about letter quality. This one seems to focus on judging and original contributions. I have 8 publications with 150 citations and reviewed for CVPR twice..."
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="btn-primary w-full py-4 text-base disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading & analyzing your RFE…
              </span>
            ) : (
              'Analyze my RFE →'
            )}
          </button>
          <p className="text-xs text-mid text-center">You&apos;ll preview the issues found before being asked to pay.</p>
        </div>
      )}

      {/* ── Nav buttons ────────────────────────────────────────────── */}
      {step < 4 && (
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="text-sm text-mid hover:text-navy transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance}
            className="btn-teal disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Pricing card ───────────────────────────────────────────── */}
      <div className="card bg-navy text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[11px] font-bold text-blue-300 uppercase tracking-widest">One-time · No subscription</p>
            <p className="text-4xl font-black text-white mt-2">$297</p>
            <p className="text-blue-300 text-sm mt-1">Preview free, pay only when you see your analysis</p>
          </div>
          <div className="space-y-2">
            {[
              'Full issue registry, risk-ranked by severity',
              'Evidence checklist for every issue',
              'Response strategy: Rebut / Supplement / Narrow',
              '90-day action timeline',
              'Professional, structured format',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-blue-100">
                <span className="text-teal font-bold flex-shrink-0">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
