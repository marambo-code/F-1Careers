'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Scoring ──────────────────────────────────────────────────────

// Country risk: 0 = paused/suspended, 1 = high-risk, 2 = open
const COUNTRY_RISK: Record<string, number> = {
  // Paused (75-country list)
  'Afghanistan': 0, 'Albania': 0, 'Algeria': 0, 'Angola': 0, 'Antigua and Barbuda': 0,
  'Bahrain': 0, 'Bangladesh': 0, 'Belarus': 0, 'Belize': 0, 'Bolivia': 0,
  'Burkina Faso': 0, 'Burma': 0, 'Burundi': 0, 'Cameroon': 0, 'Cape Verde': 0,
  'Central African Republic': 0, 'Chad': 0, 'Comoros': 0, 'Cuba': 0, 'DR Congo': 0,
  'Djibouti': 0, 'Dominica': 0, 'Equatorial Guinea': 0, 'Eritrea': 0, 'Ethiopia': 0,
  'Gabon': 0, 'Gambia': 0, 'Ghana': 0, 'Guinea': 0, 'Guinea-Bissau': 0,
  'Haiti': 0, 'Iran': 0, 'Iraq': 0, 'Ivory Coast': 0, 'Kenya': 0,
  'Laos': 0, 'Lebanon': 0, 'Lesotho': 0, 'Liberia': 0, 'Libya': 0,
  'Madagascar': 0, 'Malawi': 0, 'Mali': 0, 'Mauritania': 0, 'Mozambique': 0,
  'Nicaragua': 0, 'Niger': 0, 'Nigeria': 0, 'North Korea': 0, 'Pakistan': 0,
  'Russia': 0, 'Rwanda': 0, 'Senegal': 0, 'Sierra Leone': 0, 'Somalia': 0,
  'South Sudan': 0, 'Sudan': 0, 'Syria': 0, 'Tanzania': 0, 'Togo': 0,
  'Tunisia': 0, 'Turkmenistan': 0, 'Uganda': 0, 'Venezuela': 0, 'Yemen': 0,
  'Zimbabwe': 0,
  // High backlog (not paused but long waits)
  'China': 1, 'India': 1, 'Mexico': 1, 'Philippines': 1,
}

function getCountryRisk(country: string): number {
  if (COUNTRY_RISK[country] === 0) return 0
  if (COUNTRY_RISK[country] === 1) return 1
  return 2
}

interface Inputs {
  visa: string
  field: string
  education: string
  years: string
  country: string
  salary: string
  contributions: string
}

function computeScore(inputs: Inputs): { score: number; breakdown: { label: string; points: number; max: number; note: string }[] } {
  const breakdown: { label: string; points: number; max: number; note: string }[] = []

  // 1. Visa type (0–20)
  const visaPoints: Record<string, number> = {
    'H-1B': 20, 'L-1': 18, 'O-1': 22, 'H-1B1': 17,
    'F-1 OPT STEM': 14, 'F-1 OPT': 12, 'F-1 CPT': 10,
    'EB-2 NIW Pending': 24, 'Other': 8,
  }
  const vp = visaPoints[inputs.visa] ?? 8
  breakdown.push({
    label: 'Visa type', points: vp, max: 24,
    note: inputs.visa === 'EB-2 NIW Pending' ? 'Approved I-140 is the strongest evidence of national interest' :
          inputs.visa === 'O-1' ? 'O-1 demonstrates extraordinary ability — strong positive factor' :
          ['H-1B', 'L-1'].includes(inputs.visa) ? 'Dual-intent visa — favorable for discretionary AoS review' :
          'Consult your options with the full strategy report',
  })

  // 2. Field (0–18)
  const fieldPoints: Record<string, number> = {
    'stem_cs': 18, 'stem_bio': 18, 'medicine': 18, 'stem_phys': 16, 'stem_eng': 16,
    'education': 14, 'business': 12, 'law': 12, 'arts': 10, 'sports': 8, 'other': 10,
  }
  const fieldNames: Record<string, string> = {
    'stem_cs': 'AI / CS / Software', 'stem_bio': 'Biotech / Life Sciences',
    'medicine': 'Medicine / Healthcare', 'stem_phys': 'Physics / Chemistry',
    'stem_eng': 'Engineering', 'education': 'Education / Policy',
    'business': 'Business / Finance', 'law': 'Law / Government',
    'arts': 'Arts / Design', 'sports': 'Athletics', 'other': 'Other',
  }
  const fp = fieldPoints[inputs.field] ?? 10
  breakdown.push({
    label: 'Field of work', points: fp, max: 18,
    note: fp >= 16 ? 'STEM and medicine are top-priority national interest fields under current policy' :
          fp >= 12 ? 'Your field has recognized national importance — arguable case' :
          'Weaker NIW field — stronger personal evidence required',
  })

  // 3. Education (0–16)
  const eduPoints: Record<string, number> = {
    'phd': 16, 'md': 16, 'masters': 12, 'bachelors': 8, 'other': 5,
  }
  const ep = eduPoints[inputs.education] ?? 5
  breakdown.push({
    label: 'Education level', points: ep, max: 16,
    note: ['phd', 'md'].includes(inputs.education) ? 'Advanced degree is a primary positive discretionary factor' :
          inputs.education === 'masters' ? "Master's degree supports the national importance argument" :
          'Bachelor\'s level — extra evidence of extraordinary impact needed',
  })

  // 4. Years in field (0–14)
  const yearsPoints: Record<string, number> = {
    '1': 4, '3': 8, '6': 11, '11': 13, '16': 14,
  }
  const yp = yearsPoints[inputs.years] ?? 4
  breakdown.push({
    label: 'Years in field', points: yp, max: 14,
    note: yp >= 12 ? 'Long US career history is a strong positive equity factor' :
          yp >= 8 ? 'Solid track record — supports lawful US residence argument' :
          'Early career — focus on impact over tenure',
  })

  // 5. Country risk (0–18)
  const risk = getCountryRisk(inputs.country)
  const countryPoints = risk === 2 ? 18 : risk === 1 ? 9 : 0
  breakdown.push({
    label: 'Country consular risk', points: countryPoints, max: 18,
    note: risk === 0 ? `⚠️ ${inputs.country} is on the 75-country immigrant visa pause — consular processing is currently impossible. AoS inside the US is your only viable path.` :
          risk === 1 ? `${inputs.country} has severe priority date backlogs. Consular processing means years of waiting. Building your extraordinary circumstances case is urgent.` :
          'Your consulate is operational — consular processing is an option, but staying inside the US is still preferable.',
  })

  // 6. Contributions (0–14)
  const contribPoints: Record<string, number> = {
    'none': 2, 'some': 6, 'strong': 10, 'exceptional': 14,
  }
  const cp = contribPoints[inputs.contributions] ?? 2
  breakdown.push({
    label: 'Professional contributions', points: cp, max: 14,
    note: cp >= 10 ? 'Strong evidence of national significance — core of your extraordinary circumstances argument' :
          cp >= 6 ? 'Good foundation — your strategy report will identify how to strengthen this' :
          'This is the gap to address first — your full report will show exactly how',
  })

  const total = breakdown.reduce((s, b) => s + b.points, 0)
  const maxTotal = breakdown.reduce((s, b) => s + b.max, 0)
  const score = Math.round((total / maxTotal) * 100)

  return { score, breakdown }
}

function getScoreLabel(score: number): { label: string; color: string; bg: string; advice: string } {
  if (score >= 75) return {
    label: 'Strong Case',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    advice: 'You have strong grounds for extraordinary circumstances relief. Filing your NIW I-140 with premium processing now is your highest-leverage move — an approval makes your AoS argument nearly airtight.',
  }
  if (score >= 55) return {
    label: 'Arguable Case',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    advice: 'You have a credible case but gaps that need to be addressed before filing. Your full strategy report will identify exactly which evidence to build and which arguments are strongest for your profile.',
  }
  if (score >= 35) return {
    label: 'High Risk',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    advice: 'Significant risk of being required to do consular processing. Your full strategy report will map the fastest path to strengthening your case — some gaps can be addressed in 60–90 days.',
  }
  return {
    label: 'Critical',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    advice: 'Your current profile has serious exposure. Without action, consular processing is likely — and may be extremely difficult given your country situation. Act immediately — your full report will show your options.',
  }
}

const FIELDS = [
  { value: 'stem_cs', label: 'AI / Computer Science / Software' },
  { value: 'stem_bio', label: 'Biotech / Biology / Life Sciences' },
  { value: 'medicine', label: 'Medicine / Healthcare / Clinical Research' },
  { value: 'stem_phys', label: 'Physics / Chemistry / Materials Science' },
  { value: 'stem_eng', label: 'Engineering (non-software)' },
  { value: 'education', label: 'Education / Social Sciences / Policy' },
  { value: 'business', label: 'Business / Finance / Economics' },
  { value: 'law', label: 'Law / Government' },
  { value: 'arts', label: 'Arts / Design / Architecture' },
  { value: 'sports', label: 'Athletics / Sports' },
  { value: 'other', label: 'Other' },
]

const TOP_COUNTRIES = [
  'India', 'China', 'Mexico', 'Philippines', 'South Korea', 'Brazil',
  'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia',
  'Nigeria', 'Pakistan', 'Iran', 'Russia', 'Venezuela', 'Bangladesh',
  'Colombia', 'Taiwan', 'Vietnam', 'Indonesia', 'Egypt', 'Turkey',
  'Israel', 'Ethiopia', 'Ghana', 'Kenya', 'Other',
]

export default function StayScorePage() {
  const [step, setStep] = useState(0) // 0 = form, 1 = result
  const [inputs, setInputs] = useState<Inputs>({
    visa: '', field: '', education: '', years: '', country: '', salary: '', contributions: '',
  })
  const [result, setResult] = useState<ReturnType<typeof computeScore> | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: keyof Inputs, v: string) => setInputs(i => ({ ...i, [k]: v }))

  const canSubmit = inputs.visa && inputs.field && inputs.education && inputs.years && inputs.country && inputs.contributions

  const handleCompute = () => {
    const r = computeScore(inputs)
    setResult(r)
    setStep(1)
  }

  const handleCopy = () => {
    const scoreData = result ? getScoreLabel(result.score) : null
    const text = `My F-1 Careers Stay Score: ${result?.score}/100 — ${scoreData?.label}\n\nUnder Trump's new PM-602-0199 rule, foreigners must prove "extraordinary circumstances" to stay in the US for their green card. I just calculated my score.\n\nGet yours free: https://f1careers.app/stay-score`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const scoreData = result ? getScoreLabel(result.score) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <Link href="/login" className="text-sm text-teal font-semibold hover:underline">Sign in →</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            ⚠️ Policy Alert — May 2026
          </div>
          <h1 className="text-3xl font-black text-navy leading-tight">
            What's Your<br />
            <span className="text-teal">Stay Score?</span>
          </h1>
          <p className="text-mid text-sm max-w-md mx-auto leading-relaxed">
            On May 22, 2026, USCIS issued PM-602-0199 — ending routine green card processing inside the US.
            Now you must prove "extraordinary circumstances" to stay. This free tool calculates your odds in 60 seconds.
          </p>
        </div>

        {step === 0 && (
          <div className="card space-y-5">

            {/* Visa type */}
            <div>
              <label className="label">Current visa / immigration status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['H-1B', 'L-1', 'O-1', 'F-1 OPT STEM', 'F-1 OPT', 'F-1 CPT', 'H-1B1', 'EB-2 NIW Pending', 'Other'].map(v => (
                  <button
                    key={v}
                    onClick={() => set('visa', v)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      inputs.visa === v ? 'bg-navy text-white border-navy' : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'
                    }`}
                  >{v}</button>
                ))}
              </div>
            </div>

            {/* Field */}
            <div>
              <label className="label">Primary field of work</label>
              <select className="input" value={inputs.field} onChange={e => set('field', e.target.value)}>
                <option value="">Select your field</option>
                {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            {/* Education + Years */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Highest degree</label>
                <select className="input" value={inputs.education} onChange={e => set('education', e.target.value)}>
                  <option value="">Select</option>
                  <option value="phd">PhD / Doctorate</option>
                  <option value="md">MD / Medical Degree</option>
                  <option value="masters">Master's Degree</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Years in your field</label>
                <select className="input" value={inputs.years} onChange={e => set('years', e.target.value)}>
                  <option value="">Select</option>
                  <option value="1">Less than 1 year</option>
                  <option value="3">1–3 years</option>
                  <option value="6">3–6 years</option>
                  <option value="11">6–11 years</option>
                  <option value="16">11+ years</option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="label">Country of birth / nationality</label>
              <select className="input" value={inputs.country} onChange={e => set('country', e.target.value)}>
                <option value="">Select your country</option>
                {TOP_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {inputs.country && getCountryRisk(inputs.country) === 0 && (
                <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Your country is on the immigrant visa pause — consular processing may be impossible right now.</p>
              )}
              {inputs.country && getCountryRisk(inputs.country) === 1 && (
                <p className="text-xs text-orange-600 mt-1 font-medium">Your country has severe priority date backlogs — consular processing means years of waiting.</p>
              )}
            </div>

            {/* Contributions */}
            <div>
              <label className="label">How would you describe your professional contributions?</label>
              <p className="text-xs text-mid mb-2">Citations, patents, publications, leadership roles, media coverage, awards — anything that demonstrates national significance.</p>
              <div className="space-y-2">
                {[
                  { value: 'none', label: 'None yet — early in my career' },
                  { value: 'some', label: 'Some — a few publications, roles, or recognitions' },
                  { value: 'strong', label: 'Strong — clear record of impact and recognition' },
                  { value: 'exceptional', label: 'Exceptional — widely cited, awarded, or recognized nationally' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set('contributions', opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      inputs.contributions === opt.value
                        ? 'bg-navy text-white border-navy'
                        : 'border-gray-200 text-navy hover:border-navy/40'
                    }`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCompute}
              disabled={!canSubmit}
              className="w-full btn-teal py-4 text-base font-bold disabled:opacity-40"
            >
              Calculate my Stay Score →
            </button>

            <p className="text-xs text-center text-mid">Free · No login required · Takes 60 seconds</p>
          </div>
        )}

        {step === 1 && result && scoreData && (
          <div className="space-y-5">

            {/* Score card */}
            <div className={`card text-center space-y-3 border-2 ${scoreData.bg}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-mid">Your Stay Score</p>
              <div className="relative inline-flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-36 h-36">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={result.score >= 75 ? '#00C2A8' : result.score >= 55 ? '#B45309' : result.score >= 35 ? '#EA580C' : '#DC2626'}
                    strokeWidth="10"
                    strokeDasharray={`${(result.score / 100) * 327} 327`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="55" textAnchor="middle" className="font-black" style={{ fontSize: 26, fontWeight: 900, fill: '#1B2B6B' }}>{result.score}</text>
                  <text x="60" y="72" textAnchor="middle" style={{ fontSize: 11, fill: '#888' }}>/100</text>
                </svg>
              </div>
              <div>
                <p className={`text-2xl font-black ${scoreData.color}`}>{scoreData.label}</p>
                <p className="text-sm text-mid mt-2 max-w-sm mx-auto leading-relaxed">{scoreData.advice}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="card space-y-3">
              <p className="text-xs font-bold text-navy uppercase tracking-widest">Score Breakdown</p>
              {result.breakdown.map((b, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-navy">{b.label}</p>
                    <p className="text-xs font-bold text-mid">{b.points}/{b.max}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${b.points / b.max >= 0.75 ? 'bg-teal' : b.points / b.max >= 0.5 ? 'bg-yellow-400' : 'bg-orange-400'}`}
                      style={{ width: `${(b.points / b.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-mid leading-relaxed">{b.note}</p>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="card bg-navy-light border-navy/10 space-y-3">
              <p className="text-sm font-bold text-navy">Share your score</p>
              <p className="text-xs text-mid">Thousands of professionals need to know about this policy change. Share your score on LinkedIn, Blind, or with your colleagues.</p>
              <button
                onClick={handleCopy}
                className="w-full btn-outline text-sm"
              >
                {copied ? '✓ Copied to clipboard' : 'Copy shareable text →'}
              </button>
            </div>

            {/* CTA */}
            <div className="card bg-navy text-white text-center space-y-3">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">Your Next Step</p>
              <p className="text-lg font-bold leading-snug">
                Get your complete Extraordinary Circumstances Evidence Package
              </p>
              <p className="text-sm text-white/70 leading-relaxed">
                A full NIW strategy report, Dhanasar prong analysis, draft petition language, and the exact evidence you need to argue your case — built from your actual resume and career.
              </p>
              <Link href="/login" className="inline-block bg-teal text-white font-bold px-8 py-3 rounded-xl hover:bg-teal/90 transition-colors">
                Build my evidence package →
              </Link>
              <p className="text-xs text-white/40">$497 one-time · Instant delivery · Used by 1,000+ professionals</p>
            </div>

            <button onClick={() => { setStep(0); setResult(null) }} className="w-full text-sm text-mid hover:text-navy underline text-center">
              ← Recalculate with different inputs
            </button>
          </div>
        )}

        {/* Context banner */}
        <div className="text-center space-y-1 pb-4">
          <p className="text-xs text-mid">
            Based on USCIS Policy Memorandum PM-602-0199 (May 21, 2026) · Not legal advice
          </p>
          <p className="text-xs text-mid">
            <Link href="/for-employers" className="text-teal hover:underline">For employers with international staff →</Link>
            {' · '}
            <Link href="/cohort" className="text-teal hover:underline">Group filing program →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
