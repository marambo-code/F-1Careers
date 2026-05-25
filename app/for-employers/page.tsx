'use client'

import { useState } from 'react'
import Link from 'next/link'

const TIERS = [
  {
    name: 'Startup',
    price: '$2,500',
    period: 'one-time audit',
    employees: 'Up to 25 international employees',
    features: [
      'Individual risk assessment per employee',
      'NIW eligibility score per profile',
      'Company-level risk summary report',
      'Priority filing recommendations',
      'Email support',
    ],
    cta: 'Request startup audit',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$7,500',
    period: 'annual',
    employees: 'Up to 100 international employees',
    features: [
      'Everything in Startup',
      'Quarterly workforce immigration audits',
      'NIW petition frameworks per eligible employee',
      'Attorney referral with pre-built case files',
      'HR team training session',
      'Dedicated account manager',
    ],
    cta: 'Request demo',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'annual',
    employees: '100+ international employees',
    features: [
      'Everything in Growth',
      'Custom integrations with your HRIS',
      'Monthly immigration policy briefings',
      'Executive dashboard',
      'Priority attorney network access',
      'SLA with dedicated legal liaison',
    ],
    cta: 'Contact sales',
    highlight: false,
  },
]

export default function ForEmployersPage() {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', contact_email: '',
    company_size: '', international_headcount: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/leads/employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <div className="flex items-center gap-4">
            <Link href="/stay-score" className="text-sm text-mid hover:text-navy">Exposure Score</Link>
            <Link href="/login" className="text-sm text-teal font-semibold hover:underline">Sign in →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-navy text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            For HR Leaders & General Counsel
          </div>
          <h1 className="text-4xl font-black leading-tight">
            Don't Lose Your International Talent<br />
            <span className="text-teal">to a Policy Memo</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            The 2026 immigration policy environment means your international employees may be required to leave the US to process their green cards. The situation is evolving — and proactive teams are already acting. We tell you exactly which employees are at risk, and how to protect them.
          </p>
          <a href="#contact" className="inline-block bg-teal text-white font-bold px-8 py-4 rounded-xl hover:bg-teal/90 transition-colors text-lg">
            Request a workforce audit →
          </a>
        </div>
      </div>

      {/* The Problem */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-navy">The math your CFO needs to see</h2>
            <p className="text-mid">Losing one senior international engineer to a forced departure costs more than protecting your entire team.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { stat: '$150K–$300K', label: 'Cost to replace one senior engineer', note: 'Recruiting, onboarding, lost productivity — industry standard estimate', color: 'text-red-500' },
              { stat: '$2,805', label: 'Cost of NIW premium processing', note: 'The USCIS fee for a 45-business-day I-140 decision — your employee\'s strongest protection', color: 'text-teal' },
              { stat: '100×', label: 'ROI of proactive filing', note: 'For every dollar spent on premium processing, you protect $100+ in retention value', color: 'text-navy' },
            ].map((item, i) => (
              <div key={i} className="card text-center space-y-2">
                <p className={`text-4xl font-black ${item.color}`}>{item.stat}</p>
                <p className="text-sm font-bold text-navy">{item.label}</p>
                <p className="text-xs text-mid leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-navy text-center">What we do for your team</h2>
            <div className="space-y-3">
              {[
                { n: '1', title: 'Workforce immigration audit', desc: 'We assess every international employee\'s current visa situation, priority date, country risk, and NIW eligibility — and flag who is at risk under PM-602-0199.' },
                { n: '2', title: 'NIW eligibility scoring', desc: 'Each employee receives a personalized NIW eligibility score based on their field, education, publications, leadership, and salary. We identify exactly who has a strong extraordinary circumstances case.' },
                { n: '3', title: 'Petition framework generation', desc: 'For every eligible employee, we generate a complete NIW petition framework — field-level national importance argument, evidence map, Dhanasar analysis — ready for attorney review.' },
                { n: '4', title: 'Attorney handoff', desc: 'We integrate with your immigration counsel or connect you to our vetted attorney network. Your legal team gets pre-built case files — not blank intake forms.' },
              ].map((step) => (
                <div key={step.n} className="card flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-black flex items-center justify-center flex-shrink-0">{step.n}</div>
                  <div>
                    <p className="font-bold text-navy text-sm">{step.title}</p>
                    <p className="text-sm text-mid mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-navy text-center">Simple pricing</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {TIERS.map(tier => (
                <div key={tier.name} className={`card space-y-4 ${tier.highlight ? 'border-2 border-teal ring-2 ring-teal/10' : ''}`}>
                  {tier.highlight && (
                    <div className="text-xs font-bold text-teal uppercase tracking-widest">Most popular</div>
                  )}
                  <div>
                    <p className="font-black text-navy text-lg">{tier.name}</p>
                    <p className="text-3xl font-black text-navy mt-1">{tier.price}</p>
                    <p className="text-xs text-mid">{tier.period}</p>
                    <p className="text-xs text-teal font-semibold mt-1">{tier.employees}</p>
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((f, i) => (
                      <li key={i} className="text-xs text-mid flex gap-2">
                        <span className="text-teal flex-shrink-0">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className={`block text-center text-sm font-bold py-2.5 rounded-xl transition-colors ${
                      tier.highlight ? 'bg-teal text-white hover:bg-teal/90' : 'border border-gray-300 text-navy hover:border-navy'
                    }`}
                  >{tier.cta}</a>
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div id="contact" className="card space-y-5 max-w-xl mx-auto">
            {submitted ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-14 h-14 bg-teal-light rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                <h3 className="text-lg font-bold text-navy">We'll be in touch within 24 hours</h3>
                <p className="text-sm text-mid">A member of our team will reach out to schedule your workforce audit consultation.</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-bold text-navy">Request a workforce audit</h3>
                  <p className="text-sm text-mid mt-1">Tell us about your team and we'll be in touch within 24 hours.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Company name *</label>
                      <input className="input" required value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Acme Corp" />
                    </div>
                    <div>
                      <label className="label">Your name *</label>
                      <input className="input" required value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Jane Smith" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Work email *</label>
                    <input className="input" type="email" required value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="jane@company.com" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Company size</label>
                      <select className="input" value={form.company_size} onChange={e => set('company_size', e.target.value)}>
                        <option value="">Select</option>
                        <option value="1-25">1–25 employees</option>
                        <option value="26-100">26–100 employees</option>
                        <option value="101-500">101–500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">International employees</label>
                      <select className="input" value={form.international_headcount} onChange={e => set('international_headcount', e.target.value)}>
                        <option value="">Estimate</option>
                        <option value="1-10">1–10</option>
                        <option value="11-25">11–25</option>
                        <option value="26-50">26–50</option>
                        <option value="50+">50+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Anything else we should know?</label>
                    <textarea className="input" rows={3} value={form.message} onChange={e => set('message', e.target.value)} placeholder="e.g. We have several employees from India and China with pending I-485s..." />
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={submitting} className="w-full btn-teal py-3 font-bold disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Request workforce audit →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-mid">
        <p>© 2026 F-1 Careers · Not legal advice · <Link href="/" className="text-teal hover:underline">Home</Link></p>
      </footer>
    </div>
  )
}
