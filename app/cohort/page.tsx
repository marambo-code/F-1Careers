'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COHORT_FIELDS = [
  {
    value: 'ai_ml',
    label: 'AI / Machine Learning',
    icon: '🤖',
    niw: 'National priority field — Executive Order on AI (Oct 2023) explicitly cites AI safety as national priority',
    cost: '$2,400',
  },
  {
    value: 'biotech',
    label: 'Biotech / Life Sciences',
    icon: '🧬',
    niw: 'FDA priority areas, NIH funding alignment — strong national importance argument across subfields',
    cost: '$2,400',
  },
  {
    value: 'medicine',
    label: 'Clinical Medicine / Healthcare',
    icon: '⚕️',
    niw: 'Healthcare worker shortages in federally designated priority areas create compelling national interest',
    cost: '$2,400',
  },
  {
    value: 'clean_energy',
    label: 'Clean Energy / Climate',
    icon: '⚡',
    niw: 'IRA priorities and DOE clean energy goals — strong legislative and regulatory national importance backing',
    cost: '$2,400',
  },
  {
    value: 'software_eng',
    label: 'Software Engineering / Cybersecurity',
    icon: '💻',
    niw: 'Critical infrastructure, national security software — especially strong for cybersecurity professionals',
    cost: '$2,400',
  },
  {
    value: 'finance_econ',
    label: 'Finance / Economics / Quantitative',
    icon: '📊',
    niw: 'Demonstrable economic contribution with clear quantitative impact — arguable national importance case',
    cost: '$2,600',
  },
]

export default function CohortPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selectedField, setSelectedField] = useState('')
  const [form, setForm] = useState({ email: '', full_name: '', current_visa: '', years_in_field: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/leads/cohort')
      .then(r => r.json())
      .then(data => { if (data.counts) setCounts(data.counts) })
      .catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedField || !form.email) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/leads/cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, field: selectedField }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        setSubmitted(true)
        setCounts(c => ({ ...c, [selectedField]: (c[selectedField] ?? 0) + 1 }))
      } else {
        setError(body.error ?? 'Something went wrong.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedFieldData = COHORT_FIELDS.find(f => f.value === selectedField)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <div className="flex items-center gap-4">
            <Link href="/stay-score" className="text-sm text-mid hover:text-navy">Stay Score</Link>
            <Link href="/login" className="text-sm text-teal font-semibold hover:underline">Sign in →</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-navy/8 text-navy text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            New Program — Filing Together
          </div>
          <h1 className="text-4xl font-black text-navy leading-tight">
            NIW Cohort Filing
          </h1>
          <p className="text-lg text-mid max-w-xl mx-auto leading-relaxed">
            The same national importance argument protects 20 AI engineers. Why pay $10,000 each
            when you can file together — same attorney, shared infrastructure, fraction of the cost.
          </p>
          <div className="inline-flex items-center gap-3 bg-teal-light border border-teal/20 rounded-xl px-5 py-3">
            <span className="text-2xl font-black text-teal">$2,400–$2,600</span>
            <span className="text-sm text-navy font-medium">per person vs. $8,000–$12,000 solo attorney filing</span>
          </div>
        </div>

        {/* How it works */}
        <div className="card space-y-5">
          <h2 className="text-lg font-black text-navy">How cohort filing works</h2>
          <div className="space-y-4">
            {[
              { n: '1', title: 'Join your field\'s waitlist', desc: 'Choose your field below. When 15–20 people in the same field have joined, we open the cohort.' },
              { n: '2', title: 'Complete your profile', desc: 'Each cohort member gets a personalized NIW petition framework generated from their specific career — evidence map, Dhanasar analysis, draft language.' },
              { n: '3', title: 'Attorney review & filing', desc: 'A vetted immigration attorney reviews and finalizes each petition. The field-level national importance argument is shared across the cohort — dramatically reducing attorney time per case.' },
              { n: '4', title: 'Premium processing recommended', desc: 'Add $2,805 USCIS premium processing fee for a 45-business-day I-140 decision. Your approved I-140 is your strongest evidence of extraordinary circumstances for adjustment of status.' },
            ].map(step => (
              <div key={step.n} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-navy text-white text-sm font-black flex items-center justify-center flex-shrink-0">{step.n}</div>
                <div>
                  <p className="font-bold text-navy text-sm">{step.title}</p>
                  <p className="text-sm text-mid mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-navy">Choose your field</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {COHORT_FIELDS.map(field => {
              const count = counts[field.value] ?? 0
              const spotsLeft = Math.max(0, 20 - count)
              return (
                <button
                  key={field.value}
                  onClick={() => setSelectedField(field.value)}
                  className={`card text-left space-y-2 transition-all ${
                    selectedField === field.value
                      ? 'border-2 border-teal bg-teal/4'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{field.icon}</span>
                      <span className="font-bold text-navy text-sm">{field.label}</span>
                    </div>
                    <span className="text-xs font-bold text-teal">{field.cost}/person</span>
                  </div>
                  <p className="text-xs text-mid leading-relaxed">{field.niw}</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-3">
                      <div
                        className="h-full bg-teal rounded-full transition-all"
                        style={{ width: `${Math.min(100, (count / 20) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-mid flex-shrink-0">
                      {count > 0 ? `${count} joined` : 'Be first'}
                      {spotsLeft <= 5 && spotsLeft > 0 && <span className="text-orange-600 font-bold ml-1">· {spotsLeft} spots left</span>}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Join form */}
        {selectedField && (
          <div className="card space-y-5">
            {submitted ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-14 h-14 bg-teal-light rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                <h3 className="text-lg font-bold text-navy">You're on the waitlist for {selectedFieldData?.label}</h3>
                <p className="text-sm text-mid">We'll email you the moment your cohort reaches 15 members and is ready to open. Average time to open: 2–3 weeks given current demand.</p>
                <p className="text-sm text-mid">While you wait — <Link href="/login" className="text-teal font-semibold hover:underline">build your NIW evidence package</Link> so you're ready to file the day the cohort opens.</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-bold text-navy">Join {selectedFieldData?.label} cohort</h3>
                  <p className="text-sm text-mid mt-1">No payment now. We'll email you when the cohort opens. You decide then.</p>
                </div>
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Email *</label>
                      <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="label">Full name</label>
                      <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Optional" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Current visa status</label>
                      <select className="input" value={form.current_visa} onChange={e => set('current_visa', e.target.value)}>
                        <option value="">Select</option>
                        <option value="H-1B">H-1B</option>
                        <option value="F-1 OPT">F-1 OPT</option>
                        <option value="F-1 OPT STEM">F-1 OPT STEM</option>
                        <option value="L-1">L-1</option>
                        <option value="O-1">O-1</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Years in field</label>
                      <select className="input" value={form.years_in_field} onChange={e => set('years_in_field', e.target.value)}>
                        <option value="">Select</option>
                        <option value="1">Less than 1 year</option>
                        <option value="3">1–3 years</option>
                        <option value="6">3–6 years</option>
                        <option value="11">6+ years</option>
                      </select>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={submitting || !form.email} className="w-full btn-teal py-3 font-bold disabled:opacity-60">
                    {submitting ? 'Joining...' : `Join ${selectedFieldData?.label} cohort →`}
                  </button>
                  <p className="text-xs text-center text-mid">No commitment · No payment now · We email you when cohort opens</p>
                </form>
              </>
            )}
          </div>
        )}

        {/* Bottom context */}
        <div className="text-center text-xs text-mid pb-4 space-y-2">
          <p>F-1 Careers Cohort Filing is in beta. Final pricing and attorney partnerships confirmed before cohort opens.</p>
          <p>
            <Link href="/stay-score" className="text-teal hover:underline">Calculate your Stay Score</Link>
            {' · '}
            <Link href="/roi-calculator" className="text-teal hover:underline">ROI Calculator</Link>
            {' · '}
            <Link href="/for-employers" className="text-teal hover:underline">For Employers</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
