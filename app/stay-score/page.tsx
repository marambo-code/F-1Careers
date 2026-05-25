'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Country Risk Data ──────────────────────────────────────────────────────
// 0 = visa processing paused/suspended, 1 = high backlog, 2 = consulate open
const COUNTRY_RISK: Record<string, number> = {
  // Currently on immigrant visa processing pause
  'Afghanistan': 0, 'Albania': 0, 'Algeria': 0, 'Angola': 0, 'Antigua and Barbuda': 0,
  'Bahrain': 0, 'Bangladesh': 0, 'Belarus': 0, 'Belize': 0, 'Bolivia': 0,
  'Burkina Faso': 0, 'Burundi': 0, 'Cameroon': 0, 'Cabo Verde': 0,
  'Central African Republic': 0, 'Chad': 0, 'Comoros': 0, 'Cuba': 0,
  'Democratic Republic of Congo': 0, 'Djibouti': 0, 'Dominica': 0,
  'Equatorial Guinea': 0, 'Eritrea': 0, 'Ethiopia': 0,
  'Gabon': 0, 'Gambia': 0, 'Ghana': 0, 'Guinea': 0, 'Guinea-Bissau': 0,
  'Haiti': 0, 'Iran': 0, 'Iraq': 0, "Ivory Coast": 0, 'Kenya': 0,
  'Laos': 0, 'Lebanon': 0, 'Lesotho': 0, 'Liberia': 0, 'Libya': 0,
  'Madagascar': 0, 'Malawi': 0, 'Mali': 0, 'Mauritania': 0, 'Mozambique': 0,
  'Myanmar': 0, 'Nicaragua': 0, 'Niger': 0, 'Nigeria': 0, 'North Korea': 0,
  'Pakistan': 0, 'Russia': 0, 'Rwanda': 0, 'Senegal': 0, 'Sierra Leone': 0,
  'Somalia': 0, 'South Sudan': 0, 'Sudan': 0, 'Syria': 0,
  'Tanzania': 0, 'Togo': 0, 'Tunisia': 0, 'Turkmenistan': 0,
  'Uganda': 0, 'Venezuela': 0, 'Yemen': 0, 'Zimbabwe': 0,
  // Significant EB priority date backlog
  'China': 1, 'India': 1, 'Mexico': 1, 'Philippines': 1,
}

// Comprehensive alphabetical country list (UN members + Taiwan)
const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
  'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
  'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Costa Rica', 'Croatia',
  'Cuba', 'Cyprus', 'Czech Republic',
  'Democratic Republic of Congo', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  "Ivory Coast",
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
  'Other',
]

// ─── Field Data ────────────────────────────────────────────────────────────
const FIELDS = [
  { value: 'stem_cs',    label: 'AI / Computer Science / Software Engineering' },
  { value: 'stem_bio',   label: 'Biotech / Biology / Life Sciences' },
  { value: 'medicine',   label: 'Medicine / Clinical Healthcare / Public Health' },
  { value: 'stem_phys',  label: 'Physics / Chemistry / Materials Science' },
  { value: 'stem_eng',   label: 'Engineering (electrical, mechanical, civil, etc.)' },
  { value: 'data',       label: 'Data Science / Statistics / Quantitative Research' },
  { value: 'education',  label: 'Education / Social Sciences / Policy' },
  { value: 'business',   label: 'Business / Finance / Economics' },
  { value: 'law',        label: 'Law / Government / Public Policy' },
  { value: 'arts',       label: 'Arts / Design / Architecture / Media' },
  { value: 'sports',     label: 'Athletics / Sports' },
  { value: 'other',      label: 'Other — specify below' },
]

// ─── Contribution Criteria ─────────────────────────────────────────────────
// Each maps to an actual USCIS EB-1A or NIW evidentiary criterion
const CONTRIBUTION_CRITERIA = [
  {
    id: 'publications',
    label: 'Published original research, papers, books, or articles in professional or academic venues',
    sub: 'Peer-reviewed journals, academic conferences, industry publications',
    points: 3,
  },
  {
    id: 'citations',
    label: 'Work cited, referenced, or built upon by other researchers, professionals, or institutions',
    sub: 'Citations tracked on Google Scholar, Semantic Scholar, or referenced in industry literature',
    points: 3,
  },
  {
    id: 'patents',
    label: 'Patents filed or granted, or original intellectual property licensed or adopted by others',
    sub: 'US or international utility/design patents, technology licensing agreements',
    points: 2,
  },
  {
    id: 'peer_review',
    label: 'Invited to peer-review submissions, evaluate grant applications, or serve on editorial or scientific boards',
    sub: 'Journal reviewer, conference program committee, NIH/NSF grant reviewer, editorial board member',
    points: 2,
  },
  {
    id: 'invited_speaker',
    label: 'Invited to present at conferences, institutions, or professional panels',
    sub: 'Named or invited speaker — not just accepted abstract; includes keynotes and guest lectures',
    points: 2,
  },
  {
    id: 'awards',
    label: 'Received competitive awards, prizes, fellowships, or grants recognizing professional achievement',
    sub: 'External competitive recognition — not routine internal employee awards',
    points: 2,
  },
  {
    id: 'media',
    label: 'Featured in press, media coverage, or professional publications specifically about your work',
    sub: 'Newspapers, magazines, industry outlets, podcasts — not self-published content',
    points: 2,
  },
  {
    id: 'critical_role',
    label: 'Held a critical, senior, or otherwise distinguished role at a nationally or internationally recognized organization',
    sub: 'Position of genuine authority, influence, or expertise within a recognized institution',
    points: 2,
  },
  {
    id: 'high_salary',
    label: 'Compensation demonstrably above the median for your occupation, experience, and geographic area',
    sub: 'Documented via offer letters, W-2s, or compensation data — typically top 15% for your field',
    points: 1.5,
  },
  {
    id: 'leadership',
    label: 'Founded an organization, led significant teams, or mentored professionals who achieved recognition',
    sub: 'Founder roles, substantive management of large teams, or documented mentorship of recognized individuals',
    points: 1.5,
  },
]
// Raw max: 21 pts → we cap at 14 in scoring

// ─── Scoring Engine ────────────────────────────────────────────────────────
interface Inputs {
  visa: string
  visaOther: string
  field: string
  fieldOther: string
  education: string
  years: string
  country: string
  countryOther: string
  contributions: string[]
}

function computeScore(inputs: Inputs) {
  const breakdown: { label: string; points: number; max: number; note: string }[] = []
  const effectiveCountry = inputs.country === 'Other' ? (inputs.countryOther || 'Unknown') : inputs.country
  const effectiveField  = inputs.field  === 'other'  ? (inputs.fieldOther  || 'Other')   : inputs.field

  // 1. Visa type (0–24)
  const visaPoints: Record<string, number> = {
    'H-1B': 20, 'L-1': 18, 'O-1': 22, 'H-1B1': 17,
    'F-1 OPT STEM': 14, 'F-1 OPT': 12, 'F-1 CPT': 10,
    'EB-2 NIW Pending': 24, 'Other': 8,
  }
  const vp = visaPoints[inputs.visa] ?? 8
  breakdown.push({
    label: 'Visa & Status',
    points: vp, max: 24,
    note: inputs.visa === 'EB-2 NIW Pending'
      ? 'An approved I-140 is the single strongest evidence of national interest — your position is well-protected.'
      : inputs.visa === 'O-1'
      ? 'O-1 holders have already cleared an extraordinary ability standard — strong positive factor for AoS discretion.'
      : ['H-1B', 'L-1'].includes(inputs.visa)
      ? 'Dual-intent visa — generally viewed favorably in discretionary adjustment analysis.'
      : 'Your current status creates additional complexity. A full strategy report will map your strongest options.',
  })

  // 2. Field (0–18)
  const fieldPoints: Record<string, number> = {
    'stem_cs': 18, 'stem_bio': 18, 'medicine': 18, 'stem_phys': 16,
    'stem_eng': 16, 'data': 16, 'education': 14, 'business': 12,
    'law': 12, 'arts': 10, 'sports': 8, 'other': 10,
  }
  const fieldKey = inputs.field === 'other' ? 'other' : inputs.field
  const fp = fieldPoints[fieldKey] ?? 10
  const fieldLabel = FIELDS.find(f => f.value === inputs.field)?.label.split(' /')[0] || effectiveField
  breakdown.push({
    label: 'Field of Work',
    points: fp, max: 18,
    note: fp >= 16
      ? `${fieldLabel} is a priority national interest field under current USCIS policy — strong NIW argument available.`
      : fp >= 12
      ? `${fieldLabel} has recognized national importance — a compelling case is arguable with the right evidence.`
      : `${fieldLabel} requires stronger individual evidence of impact to build a successful national interest argument.`,
  })

  // 3. Education (0–16)
  const eduPoints: Record<string, number> = {
    'phd': 16, 'md': 16, 'masters': 12, 'bachelors': 8, 'other': 5,
  }
  const ep = eduPoints[inputs.education] ?? 5
  breakdown.push({
    label: 'Education Level',
    points: ep, max: 16,
    note: ['phd', 'md'].includes(inputs.education)
      ? 'Terminal degree is a primary positive factor in discretionary AoS analysis.'
      : inputs.education === 'masters'
      ? "Advanced degree supports the national importance argument across all three Dhanasar prongs."
      : "Additional evidence of outsized impact is essential to compensate for educational credential level.",
  })

  // 4. Years in field (0–14)
  const yearsPoints: Record<string, number> = {
    '1': 4, '3': 8, '6': 11, '11': 13, '16': 14,
  }
  const yp = yearsPoints[inputs.years] ?? 4
  breakdown.push({
    label: 'Career Tenure',
    points: yp, max: 14,
    note: yp >= 12
      ? 'Long, established US career creates strong equitable considerations in discretionary review.'
      : yp >= 8
      ? 'Solid professional track record supports lawful US presence argument.'
      : 'Earlier-career candidates should emphasize trajectory and outsized impact relative to years.',
  })

  // 5. Country consular risk (0–18)
  const risk = COUNTRY_RISK[effectiveCountry] !== undefined ? COUNTRY_RISK[effectiveCountry] : 2
  const countryPoints = risk === 2 ? 18 : risk === 1 ? 9 : 0
  breakdown.push({
    label: 'Consular Processing Risk',
    points: countryPoints, max: 18,
    note: risk === 0
      ? `${effectiveCountry} is currently subject to immigrant visa processing restrictions — consular processing is not a viable path. Adjustment of status inside the US is your only realistic option, making your extraordinary circumstances case critically urgent.`
      : risk === 1
      ? `${effectiveCountry} nationals face severe EB priority date backlogs. Consular processing could mean years outside the US. Building and filing your AoS case now is the highest-priority action available to you.`
      : 'Your consulate is currently operational — consular processing remains an option, though building an AoS case still provides meaningful protection against future policy changes.',
  })

  // 6. Professional record (0–14)
  const rawContribPoints = inputs.contributions.reduce((sum, id) => {
    const c = CONTRIBUTION_CRITERIA.find(c => c.id === id)
    return sum + (c?.points ?? 0)
  }, 0)
  const cp = Math.min(14, Math.round(rawContribPoints))
  const selectedCount = inputs.contributions.length
  breakdown.push({
    label: 'Professional Evidence Record',
    points: cp, max: 14,
    note: cp >= 10
      ? `${selectedCount} documented criteria — strong evidentiary foundation for an extraordinary circumstances claim. Your full report will convert this into a structured petition framework.`
      : cp >= 5
      ? `${selectedCount} documented criteria — solid foundation. Your strategy report will identify which 2–3 additional criteria you can build in 60–90 days.`
      : selectedCount > 0
      ? 'Evidence building is your highest-leverage activity right now. Your report will give you a concrete 90-day plan.'
      : 'This is the gap to prioritize. Your full strategy report will show exactly how to build this evidence — often faster than people expect.',
  })

  const total = breakdown.reduce((s, b) => s + b.points, 0)
  const maxTotal = breakdown.reduce((s, b) => s + b.max, 0)
  const score = Math.round((total / maxTotal) * 100)
  return { score, breakdown }
}

function getScoreLabel(score: number) {
  if (score >= 75) return {
    label: 'Well-Protected',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    advice: 'Your profile demonstrates meaningful grounds for extraordinary circumstances relief. Filing your NIW I-140 with premium processing now is your highest-leverage move — an approval makes your AoS argument substantively stronger.',
  }
  if (score >= 55) return {
    label: 'Arguable Case',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    advice: 'You have a credible case with identifiable gaps. Your full strategy report will specify which evidence to build and which arguments carry the most weight for your particular profile.',
  }
  if (score >= 35) return {
    label: 'Significant Exposure',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    advice: 'Your profile has material vulnerability to consular processing requirements. Your full strategy report maps the fastest evidence-building path — several gaps can realistically be addressed within 60–90 days.',
  }
  return {
    label: 'Critical Exposure',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    advice: 'Without proactive action, consular processing is a serious near-term risk — particularly given your country situation. Your full report will lay out every available option and the most urgent steps to take immediately.',
  }
}

// ─── Component ────────────────────────────────────────────────────────────
export default function ExposureScorePage() {
  const [step, setStep] = useState(0)
  const [inputs, setInputs] = useState<Inputs>({
    visa: '', visaOther: '',
    field: '', fieldOther: '',
    education: '', years: '',
    country: '', countryOther: '',
    contributions: [],
  })
  const [result, setResult] = useState<ReturnType<typeof computeScore> | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: keyof Inputs, v: string | string[]) =>
    setInputs(i => ({ ...i, [k]: v }))

  const toggleContribution = (id: string) => {
    setInputs(i => ({
      ...i,
      contributions: i.contributions.includes(id)
        ? i.contributions.filter(c => c !== id)
        : [...i.contributions, id],
    }))
  }

  const effectiveCountry = inputs.country === 'Other' ? inputs.countryOther : inputs.country
  const countryRisk = effectiveCountry
    ? (COUNTRY_RISK[effectiveCountry] !== undefined ? COUNTRY_RISK[effectiveCountry] : 2)
    : null

  const canSubmit =
    inputs.visa &&
    (inputs.visa !== 'Other' || inputs.visaOther.trim()) &&
    inputs.field &&
    (inputs.field !== 'other' || inputs.fieldOther.trim()) &&
    inputs.education && inputs.years &&
    inputs.country &&
    (inputs.country !== 'Other' || inputs.countryOther.trim())

  const handleCompute = () => {
    const r = computeScore(inputs)
    setResult(r)
    setStep(1)
  }

  const handleCopy = () => {
    const scoreData = result ? getScoreLabel(result.score) : null
    const text = `My Immigration Exposure Score: ${result?.score}/100 — ${scoreData?.label}\n\nUS immigration policy is changing rapidly. I just calculated my Exposure Score to understand where I stand and what I need to do. Takes 60 seconds.\n\nGet yours free: https://f1careers.app/stay-score`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const scoreData = result ? getScoreLabel(result.score) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <Link href="/login" className="text-sm text-teal font-semibold hover:underline">Sign in →</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Immigration Policy Alert — 2026
          </div>
          <h1 className="text-3xl font-black text-navy leading-tight">
            What&apos;s Your<br />
            <span className="text-teal">Immigration Exposure Score?</span>
          </h1>
          <p className="text-mid text-sm max-w-md mx-auto leading-relaxed">
            The US immigration landscape is shifting rapidly. Policy changes in 2026 have
            redefined who can adjust status inside the country — and on what grounds.
            This free tool gives you a clear-eyed assessment of your exposure in under 2 minutes.
          </p>
        </div>

        {step === 0 && (
          <div className="card space-y-7">

            {/* ── Visa Type ─────────────────────────────────────── */}
            <div>
              <label className="label">Current visa / immigration status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['H-1B', 'L-1', 'O-1', 'F-1 OPT STEM', 'F-1 OPT', 'F-1 CPT', 'H-1B1', 'EB-2 NIW Pending', 'Other'].map(v => (
                  <button
                    key={v}
                    onClick={() => set('visa', v)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      inputs.visa === v
                        ? 'bg-navy text-white border-navy'
                        : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'
                    }`}
                  >{v}</button>
                ))}
              </div>
              {inputs.visa === 'Other' && (
                <input
                  className="input mt-2"
                  placeholder="Describe your current immigration status"
                  value={inputs.visaOther}
                  onChange={e => set('visaOther', e.target.value)}
                />
              )}
            </div>

            {/* ── Field of Work ──────────────────────────────────── */}
            <div>
              <label className="label">Primary field of work</label>
              <select
                className="input"
                value={inputs.field}
                onChange={e => set('field', e.target.value)}
              >
                <option value="">Select your field</option>
                {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              {inputs.field === 'other' && (
                <input
                  className="input mt-2"
                  placeholder="Describe your field or profession (e.g., Urban Planning, Architecture, Music Performance)"
                  value={inputs.fieldOther}
                  onChange={e => set('fieldOther', e.target.value)}
                />
              )}
            </div>

            {/* ── Education + Years ─────────────────────────────── */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Highest degree</label>
                <select className="input" value={inputs.education} onChange={e => set('education', e.target.value)}>
                  <option value="">Select</option>
                  <option value="phd">PhD / Doctorate</option>
                  <option value="md">MD / Medical Degree</option>
                  <option value="masters">Master&apos;s Degree</option>
                  <option value="bachelors">Bachelor&apos;s Degree</option>
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

            {/* ── Country ───────────────────────────────────────── */}
            <div>
              <label className="label">Country of birth / nationality</label>
              <select
                className="input"
                value={inputs.country}
                onChange={e => set('country', e.target.value)}
              >
                <option value="">Select your country</option>
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {inputs.country === 'Other' && (
                <input
                  className="input mt-2"
                  placeholder="Enter your country of birth or nationality"
                  value={inputs.countryOther}
                  onChange={e => set('countryOther', e.target.value)}
                />
              )}
              {inputs.country && inputs.country !== 'Other' && countryRisk === 0 && (
                <p className="text-xs text-red-600 mt-1.5 font-medium bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  Your country of nationality is currently subject to immigrant visa processing restrictions. Consular processing may not be available to you — adjustment of status inside the US is likely your only path.
                </p>
              )}
              {inputs.country && inputs.country !== 'Other' && countryRisk === 1 && (
                <p className="text-xs text-orange-700 mt-1.5 font-medium bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg">
                  Your country has significant EB priority date backlogs. Consular processing could mean years of waiting outside the US. Filing your extraordinary circumstances case now substantially reduces that risk.
                </p>
              )}
            </div>

            {/* ── Professional Evidence Record ──────────────────── */}
            <div>
              <div className="mb-3">
                <label className="label mb-0.5">Professional evidence record</label>
                <p className="text-xs text-mid leading-relaxed">
                  Select every item that applies to your professional history. These correspond directly
                  to the evidentiary standards USCIS uses when evaluating extraordinary circumstances claims.
                  Be precise — this is not a self-assessment quiz, it&apos;s a documentation inventory.
                </p>
              </div>
              <div className="space-y-2">
                {CONTRIBUTION_CRITERIA.map(c => {
                  const selected = inputs.contributions.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleContribution(c.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                        selected
                          ? 'bg-teal/5 border-teal text-navy'
                          : 'border-gray-200 text-navy hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          selected ? 'bg-teal border-teal' : 'border-gray-300'
                        }`}>
                          {selected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-snug">{c.label}</p>
                          <p className="text-xs text-mid mt-0.5 leading-relaxed">{c.sub}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {inputs.contributions.length === 0 && (
                <p className="text-xs text-mid mt-2 text-center">Select all that apply — or leave blank if none currently apply.</p>
              )}
            </div>

            <button
              onClick={handleCompute}
              disabled={!canSubmit}
              className="w-full btn-teal py-4 text-base font-bold disabled:opacity-40"
            >
              Calculate my Exposure Score →
            </button>

            <p className="text-xs text-center text-mid">Free · No login required · Under 2 minutes</p>
          </div>
        )}

        {step === 1 && result && scoreData && (
          <div className="space-y-5">

            {/* Score card */}
            <div className={`card text-center space-y-3 border-2 ${scoreData.bg}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-mid">Your Immigration Exposure Score</p>
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
                  <text x="60" y="55" textAnchor="middle" style={{ fontSize: 26, fontWeight: 900, fill: '#1B2B6B' }}>{result.score}</text>
                  <text x="60" y="72" textAnchor="middle" style={{ fontSize: 11, fill: '#888' }}>/100</text>
                </svg>
              </div>
              <div>
                <p className={`text-2xl font-black ${scoreData.color}`}>{scoreData.label}</p>
                <p className="text-sm text-mid mt-2 max-w-sm mx-auto leading-relaxed">{scoreData.advice}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="card space-y-4">
              <p className="text-xs font-bold text-navy uppercase tracking-widest">Score Breakdown</p>
              {result.breakdown.map((b, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-navy">{b.label}</p>
                    <p className="text-xs font-bold text-mid">{b.points} / {b.max}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        b.points / b.max >= 0.75 ? 'bg-teal' :
                        b.points / b.max >= 0.5 ? 'bg-yellow-400' : 'bg-orange-400'
                      }`}
                      style={{ width: `${(b.points / b.max) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-mid leading-relaxed">{b.note}</p>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="card space-y-3">
              <p className="text-sm font-bold text-navy">Share with colleagues</p>
              <p className="text-xs text-mid">Many professionals in similar situations aren&apos;t aware of their exposure. Share your score on LinkedIn, Blind, or your team Slack.</p>
              <button onClick={handleCopy} className="w-full btn-outline text-sm">
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
                A full NIW strategy report, Dhanasar prong analysis, draft petition language, and the exact evidence map you need — built from your actual resume and career record.
              </p>
              <Link href="/login" className="inline-block bg-teal text-white font-bold px-8 py-3 rounded-xl hover:bg-teal/90 transition-colors">
                Build my evidence package →
              </Link>
              <p className="text-xs text-white/40">$497 one-time · Instant delivery</p>
            </div>

            <button
              onClick={() => { setStep(0); setResult(null) }}
              className="w-full text-sm text-mid hover:text-navy underline text-center"
            >
              ← Recalculate with different inputs
            </button>
          </div>
        )}

        <div className="text-center space-y-1.5 pb-4">
          <p className="text-xs text-mid">
            Based on current USCIS policy guidance · Not legal advice · Consult a licensed immigration attorney
          </p>
          <p className="text-xs text-mid">
            <Link href="/roi-calculator" className="text-teal hover:underline">Calculate your financial exposure →</Link>
            {' · '}
            <Link href="/for-employers" className="text-teal hover:underline">For employers →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
