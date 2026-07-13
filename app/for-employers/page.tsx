'use client'

import { useState } from 'react'
import Link from 'next/link'
import BrandLink from '@/components/BrandLink'
import SiteFooter from '@/components/SiteFooter'


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
          <BrandLink className="text-navy font-bold text-lg" />
          <div className="flex items-center gap-4">
            <Link href="/explorer" className="text-sm text-mid hover:text-navy">Eligibility Check</Link>
            <Link href="/login" className="text-sm text-teal font-semibold hover:underline">Sign in →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-navy text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            For founders and heads of people
          </div>
          <h1 className="text-4xl font-black leading-tight">
            Your international employees can get green cards<br />
            <span className="text-teal">without your sponsorship</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            EB-1A and EB-2 NIW are self-petitioned green card categories. Your employee files as their own petitioner, so there is no H-1B lottery, no PERM labor certification, and your company signs nothing with USCIS. You pay for the benefit, like a 401k match, and your team gets a permanent path to stay.
          </p>
          <a href="#contact" className="inline-block bg-teal text-white font-bold px-8 py-4 rounded-xl hover:bg-teal/90 transition-colors text-lg">
            Talk to us about your team →
          </a>
        </div>
      </div>

      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-14">

          {/* The math */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-navy">The math, honestly</h2>
              <p className="text-mid max-w-2xl mx-auto">Sponsorship is expensive and uncertain. A self-petitioned green card removes both problems, and the employee carries the case.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { stat: '~1 in 4', label: 'H-1B registrations selected in the initial FY2025 lottery', note: 'USCIS reported 470,342 eligible registrations and 120,603 initial selections for FY2025. Sponsorship starts with a lottery your company cannot control.' },
                { stat: '3 to 4×', label: 'A departing employee can cost multiples of their salary to replace', note: 'SHRM has published estimates that the total cost of replacing an employee can reach three to four times the position\'s salary once recruiting, ramp-up, and lost productivity are counted.' },
                { stat: '$0', label: 'What your company files with USCIS for a self-petition', note: 'The employee is the petitioner. No lottery registration, no PERM recruitment, no employer petition, no company signature.' },
              ].map((item, i) => (
                <div key={i} className="card text-center space-y-2">
                  <p className="text-4xl font-black text-navy">{item.stat}</p>
                  <p className="text-sm font-bold text-navy">{item.label}</p>
                  <p className="text-xs text-mid leading-relaxed">{item.note}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-mid text-center max-w-2xl mx-auto leading-relaxed">
              There is also the spend you avoid later. Every employee who secures a green card on their own petition is one less H-1B registration, extension, and PERM process your company pays for in the years ahead.
            </p>
          </div>

          {/* How self-petition works */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-navy text-center">How self-petition works</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card space-y-2">
                <p className="font-bold text-navy text-sm">EB-1A, Extraordinary Ability</p>
                <p className="text-sm text-mid leading-relaxed">
                  For people with a strong record in their field, shown through evidence like publications, judging, original contributions, press, or a high salary. No employer or job offer is required.
                </p>
              </div>
              <div className="card space-y-2">
                <p className="font-bold text-navy text-sm">EB-2 NIW, National Interest Waiver</p>
                <p className="text-sm text-mid leading-relaxed">
                  For advanced-degree professionals whose work matters to the United States. The usual job offer and labor certification requirements are waived, so the employee can file on their own.
                </p>
              </div>
            </div>
            <div className="card space-y-3">
              <p className="text-sm text-navy font-bold">Your employee is the petitioner. You sign nothing.</p>
              <p className="text-sm text-mid leading-relaxed">
                The petition belongs to the employee, is prepared with a licensed immigration attorney, and follows them even if they change jobs. The honest caveat: not everyone qualifies. These categories have real evidentiary standards, which is why eligibility is checked first, before anyone spends money on a filing.
              </p>
              <p className="text-sm text-mid leading-relaxed">
                Any employee can start with our free <Link href="/explorer" className="text-teal font-semibold hover:underline">self-petition eligibility check</Link> and see where they stand in a few minutes.
              </p>
            </div>
          </div>

          {/* Ways companies work with us */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-navy text-center">Ways companies work with us</h2>
            <div className="space-y-3">
              <div className="card space-y-2">
                <p className="font-bold text-navy text-sm">Company-paid access to F-1 Careers</p>
                <p className="text-sm text-mid leading-relaxed">
                  You cover F-1 Careers memberships for your international employees so each of them gets an eligibility assessment, a personal strategy report, and a roadmap toward a self-petition. It starts as a simple invoiced arrangement, no procurement process, no long contract.
                </p>
              </div>
              <div className="card space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-navy text-sm">Company-sponsored cohort filing</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-light text-teal">Beta</span>
                </div>
                <p className="text-sm text-mid leading-relaxed">
                  You fund actual petition preparation for a group of eligible employees, who file together as a cohort with licensed attorneys. Current beta pricing is roughly $2,400 to $2,600 per person. The program is in beta, and final pricing and attorney partnerships are confirmed before a cohort opens. Details at <Link href="/cohort" className="text-teal font-semibold hover:underline">the cohort page</Link>.
                </p>
              </div>
            </div>
            <p className="text-xs text-mid text-center">
              We are also building a larger employer platform. If that is what you need, mention it in the form below.
            </p>
          </div>

          {/* What F-1 Careers is not */}
          <div className="card space-y-3 bg-navy text-white border-0">
            <h2 className="text-lg font-black">What F-1 Careers is not</h2>
            <ul className="space-y-2 text-sm text-white/80 leading-relaxed">
              <li>We are not a law firm, and nothing on this page or in our product is legal advice.</li>
              <li>Employees who file do so with licensed immigration attorneys.</li>
              <li>Your company never gets access to an individual employee's immigration information without that employee's consent. You fund the benefit; the case belongs to them.</li>
            </ul>
          </div>

          {/* Contact form */}
          <div id="contact" className="card space-y-5 max-w-xl mx-auto">
            {submitted ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-14 h-14 bg-teal-light rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                <h3 className="text-lg font-bold text-navy">Thanks, we got it</h3>
                <p className="text-sm text-mid">We will reply by email within a few business days to talk through what would fit your team.</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-bold text-navy">Talk to us about your team</h3>
                  <p className="text-sm text-mid mt-1">Tell us a little about your company and we will reply by email within a few business days.</p>
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
                        <option value="1-25">1-25 employees</option>
                        <option value="26-100">26-100 employees</option>
                        <option value="101-500">101-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">International employees</label>
                      <select className="input" value={form.international_headcount} onChange={e => set('international_headcount', e.target.value)}>
                        <option value="">Estimate</option>
                        <option value="1-10">1-10</option>
                        <option value="11-25">11-25</option>
                        <option value="26-50">26-50</option>
                        <option value="50+">50+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Anything else we should know?</label>
                    <textarea className="input" rows={3} value={form.message} onChange={e => set('message', e.target.value)} placeholder="e.g. We have a dozen engineers on OPT and H-1B and want to offer this as a benefit..." />
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={submitting} className="w-full btn-teal py-3 font-bold disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Talk to us about your team →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
