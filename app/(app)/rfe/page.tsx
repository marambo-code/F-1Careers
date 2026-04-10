'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PETITION_TYPES = [
  { value: 'eb1a',    label: 'EB-1A — Extraordinary Ability' },
  { value: 'eb2niw',  label: 'EB-2 NIW — National Interest Waiver' },
  { value: 'eb1b',    label: 'EB-1B — Outstanding Researcher / Professor' },
  { value: 'o1',      label: 'O-1A / O-1B — Temporary Extraordinary Ability' },
  { value: 'eb2perm', label: 'EB-2 / EB-3 — PERM Labor Certification' },
  { value: 'h1b',     label: 'H-1B — Specialty Occupation' },
  { value: 'other',   label: 'Other / Unsure' },
]

const FIELD_OPTIONS = [
  { value: 'stem',      label: 'STEM (Science, Technology, Engineering, Math)' },
  { value: 'medicine',  label: 'Medicine / Healthcare / Clinical Research' },
  { value: 'business',  label: 'Business / Finance / Economics' },
  { value: 'arts',      label: 'Arts / Film / Design / Music / Architecture' },
  { value: 'sports',    label: 'Athletics / Sports' },
  { value: 'law',       label: 'Law / Policy / Government' },
  { value: 'education', label: 'Education / Social Sciences' },
  { value: 'other',     label: 'Other' },
]

export default function RFEUploadPage() {
  const router = useRouter()
  const supabase = createClient()

  const [file, setFile] = useState<File | null>(null)
  const [petitionType, setPetitionType] = useState('')
  const [rfeField, setRfeField] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File | undefined) => {
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20MB.'); return }
    setError('')
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    if (!petitionType) { setError('Please select your petition type.'); return }
    if (!rfeField) { setError('Please select your field.'); return }

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
      // Surface the exact error (scanned PDF, etc.) without a wrapper prefix
      setError(body?.error ?? 'Analysis failed — please try again.')
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-navy uppercase tracking-widest">RFE Analyzer</span>
        <h1 className="text-2xl font-bold text-navy mt-1">RFE Response Analyzer</h1>
        <p className="text-mid mt-2 leading-relaxed">
          Upload your USCIS Request for Evidence. Get a risk-ranked, issue-by-issue response
          strategy with evidence checklists — formatted to hand directly to your attorney.
        </p>
      </div>

      {/* What is an RFE */}
      <div className="card bg-navy-light border-navy/10">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-navy/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-navy text-sm mb-1">What is an RFE?</h2>
            <p className="text-sm text-mid leading-relaxed">
              A Request for Evidence is a formal USCIS document issued when your visa petition lacks
              sufficient proof. Responding incorrectly — or missing the deadline — can result in denial.
              Our AI reads the RFE and tells you exactly what USCIS is asking for and how to respond.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">

        {/* Petition type */}
        <div>
          <label className="label">Petition Type <span className="text-red-500">*</span></label>
          <p className="text-xs text-mid mb-1.5">Select the type of petition your RFE was issued for. This determines which USCIS criteria apply.</p>
          <select
            className="input"
            value={petitionType}
            onChange={e => setPetitionType(e.target.value)}
            required
          >
            <option value="">Select petition type</option>
            {PETITION_TYPES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Field */}
        <div>
          <label className="label">Petitioner&apos;s Field <span className="text-red-500">*</span></label>
          <p className="text-xs text-mid mb-1.5">Your field helps the AI calibrate evidence standards and cite field-relevant benchmarks.</p>
          <select
            className="input"
            value={rfeField}
            onChange={e => setRfeField(e.target.value)}
            required
          >
            <option value="">Select your field</option>
            {FIELD_OPTIONS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* File upload */}
        <div>
          <label className="label">Upload your RFE document (PDF) <span className="text-red-500">*</span></label>
          <p className="text-xs text-mid mb-1.5">Upload the full RFE PDF exactly as received from USCIS. Max 20MB.</p>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragOver ? 'border-teal bg-teal-light' :
              file ? 'border-teal bg-teal-light' :
              'border-border hover:border-navy/40 hover:bg-gray-50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => document.getElementById('rfe-upload')?.click()}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={e => handleFile(e.target.files?.[0])}
              className="hidden"
              id="rfe-upload"
            />
            {file ? (
              <div>
                <div className="w-10 h-10 bg-teal/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-teal">{file.name}</p>
                <p className="text-sm text-mid mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-semibold text-navy">Drop your RFE PDF here</p>
                <p className="text-sm text-mid mt-1">or click to browse · PDF only · Max 20MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional context */}
        <div>
          <label className="label">Additional Context <span className="text-mid font-normal">(optional but improves accuracy)</span></label>
          <p className="text-xs text-mid mb-1.5">
            Any context that helps the AI calibrate its response: previous denials, specific arguments USCIS made,
            evidence already submitted, your attorney&apos;s initial read, or anything else relevant.
          </p>
          <textarea
            className="input"
            rows={4}
            value={additionalContext}
            onChange={e => setAdditionalContext(e.target.value)}
            placeholder="e.g. This is a second RFE on my EB-1A petition. The first RFE was about letter quality and I responded with 3 new letters from full professors. This second RFE seems to focus on the judging criterion and original contributions. I have 8 publications with 150 total citations and peer-reviewed for CVPR twice..."
          />
        </div>

        {/* Privacy notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex gap-2">
          <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-yellow-800">
            <strong>Private &amp; secure.</strong> Your document is processed only to generate your analysis and is never shared.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || !petitionType || !rfeField || uploading}
          className="btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading & analyzing...
            </span>
          ) : 'Analyze my RFE →'}
        </button>
        <p className="text-xs text-mid text-center">You&apos;ll preview the issues found before being asked to pay.</p>
      </form>

      {/* Pricing */}
      <div className="card bg-navy text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm">One-time · No subscription</p>
            <p className="text-3xl font-bold mt-1">$200</p>
          </div>
          <div className="text-xs text-blue-300 space-y-1.5 text-right">
            <p>✓ Full issue registry, risk-ranked</p>
            <p>✓ Evidence checklist per issue</p>
            <p>✓ Response strategy (Rebut/Supplement/Narrow)</p>
            <p>✓ 90-day action timeline</p>
            <p>✓ Attorney-ready format</p>
          </div>
        </div>
      </div>
    </div>
  )
}
