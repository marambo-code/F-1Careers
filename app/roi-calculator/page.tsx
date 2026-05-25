'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Country data: tier + estimated consular wait ──────────────────────────
// Tiers: 'blocked' (visa pause/travel ban), 'backlog' (EB wait years), 'open'
type CountryEntry = { tier: 'blocked' | 'backlog' | 'open'; minMonths: number; maxMonths: number; label: string }

const COUNTRY_DATA: Record<string, CountryEntry> = {
  // ── Blocked: consular processing suspended ─────────────────────────────
  'Nigeria':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Nigeria — immigrant visa & travel ban restrictions in effect' },
  'Pakistan':     { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Pakistan — immigrant visa processing paused (Jan 2026)' },
  'Iran':         { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Iran — full travel ban & visa suspension' },
  'Russia':       { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Russia — immigrant visa processing paused (Jan 2026)' },
  'Venezuela':    { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Venezuela — partial travel ban & immigrant visa restrictions' },
  'Bangladesh':   { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Bangladesh — immigrant visa processing paused (Jan 2026)' },
  'Ethiopia':     { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Ethiopia — immigrant visa processing paused (Jan 2026)' },
  'Egypt':        { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Egypt — immigrant visa processing paused (Jan 2026)' },
  'Ghana':        { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Ghana — immigrant visa processing paused (Jan 2026)' },
  'Tanzania':     { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Tanzania — partial travel ban & immigrant visa restrictions' },
  'Uganda':       { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Uganda — immigrant visa processing paused (Jan 2026)' },
  'Zambia':       { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Zambia — partial travel ban in effect (PP 10998)' },
  'Zimbabwe':     { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Zimbabwe — partial travel ban in effect (PP 10998)' },
  'Syria':        { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Syria — full travel ban & visa suspension' },
  'Somalia':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Somalia — full travel ban & visa suspension' },
  'Yemen':        { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Yemen — full travel ban & visa suspension' },
  'Haiti':        { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Haiti — full travel ban & visa suspension' },
  'Cuba':         { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Cuba — partial travel ban & immigrant visa restrictions' },
  'Nicaragua':    { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Nicaragua — immigrant visa processing paused (Jan 2026)' },
  'Morocco':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Morocco — immigrant visa processing paused (Jan 2026)' },
  'Algeria':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Algeria — immigrant visa processing paused (Jan 2026)' },
  'Brazil':       { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Brazil — immigrant visa processing paused (Jan 2026)' },
  'Colombia':     { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Colombia — immigrant visa processing paused (Jan 2026)' },
  'Jamaica':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Jamaica — immigrant visa processing paused (Jan 2026)' },
  'Guatemala':    { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Guatemala — immigrant visa processing paused (Jan 2026)' },
  'Nepal':        { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Nepal — immigrant visa processing paused (Jan 2026)' },
  'Senegal':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Senegal — partial travel ban & immigrant visa restrictions' },
  'Cameroon':     { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Cameroon — immigrant visa processing paused (Jan 2026)' },
  'Lebanon':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Lebanon — immigrant visa processing paused (Jan 2026)' },
  'Iraq':         { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Iraq — immigrant visa processing paused (Jan 2026)' },
  'Kazakhstan':   { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Kazakhstan — immigrant visa processing paused (Jan 2026)' },
  'Uzbekistan':   { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Uzbekistan — immigrant visa processing paused (Jan 2026)' },
  'Belarus':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Belarus — immigrant visa processing paused (Jan 2026)' },
  'Thailand':     { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Thailand — immigrant visa processing paused (Jan 2026)' },
  'Tunisia':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Tunisia — immigrant visa processing paused (Jan 2026)' },
  'Uruguay':      { tier: 'blocked', minMonths: 0, maxMonths: 0, label: 'Uruguay — immigrant visa processing paused (Jan 2026)' },

  // ── EB Backlog ─────────────────────────────────────────────────────────
  'India':        { tier: 'backlog', minMonths: 36, maxMonths: 84, label: 'India — severe EB priority date backlog (3–7+ year wait typical)' },
  'China':        { tier: 'backlog', minMonths: 24, maxMonths: 60, label: 'China — significant EB backlog (2–5+ year wait)' },
  'Mexico':       { tier: 'backlog', minMonths: 12, maxMonths: 36, label: 'Mexico — EB backlog in several categories (1–3 year wait)' },
  'Philippines':  { tier: 'backlog', minMonths: 12, maxMonths: 30, label: 'Philippines — EB backlog in several categories (1–2.5 year wait)' },

  // ── Open Consulates ───────────────────────────────────────────────────
  'South Korea':  { tier: 'open', minMonths: 9, maxMonths: 18, label: 'South Korea — consulate operational' },
  'Taiwan':       { tier: 'open', minMonths: 9, maxMonths: 18, label: 'Taiwan — consulate operational' },
  'Japan':        { tier: 'open', minMonths: 9, maxMonths: 18, label: 'Japan — consulate operational' },
  'Germany':      { tier: 'open', minMonths: 8, maxMonths: 16, label: 'Germany — consulate operational' },
  'France':       { tier: 'open', minMonths: 8, maxMonths: 16, label: 'France — consulate operational' },
  'United Kingdom':{ tier: 'open', minMonths: 8, maxMonths: 16, label: 'United Kingdom — consulate operational' },
  'Canada':       { tier: 'open', minMonths: 7, maxMonths: 14, label: 'Canada — consulate operational' },
  'Australia':    { tier: 'open', minMonths: 7, maxMonths: 14, label: 'Australia — consulate operational' },
  'Israel':       { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Israel — consulate operational' },
  'Turkey':       { tier: 'open', minMonths: 10, maxMonths: 18, label: 'Turkey — consulate operational' },
  'Indonesia':    { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Indonesia — consulate operational' },
  'Vietnam':      { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Vietnam — consulate operational' },
  'Sri Lanka':    { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Sri Lanka — consulate operational' },
  'Other (open)': { tier: 'open', minMonths: 9, maxMonths: 18, label: 'Other country — consulate operational (estimated 9–18 months)' },
}

// ── Category wait multipliers ──────────────────────────────────────────────
const CATEGORIES = [
  { value: 'eb2_niw',  label: 'EB-2 NIW (National Interest Waiver)', mult: 1.0 },
  { value: 'eb1a',     label: 'EB-1A (Extraordinary Ability)',        mult: 0.8 },
  { value: 'eb2_adv',  label: 'EB-2 PERM (Advanced Degree)',          mult: 1.4 },
  { value: 'eb3',      label: 'EB-3 (Skilled Worker)',                mult: 1.6 },
  { value: 'family',   label: 'Family-based',                         mult: 1.3 },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtRange(lo: number, hi: number) {
  return `${fmt(lo)} – ${fmt(hi)}`
}

export default function ROICalculatorPage() {
  const [salary, setSalary] = useState('')
  const [country, setCountry] = useState('')
  const [category, setCategory] = useState('')
  const [scenario, setScenario] = useState<'typical' | 'worst'>('typical')
  const [computed, setComputed] = useState(false)

  const salaryNum = parseInt(salary.replace(/\D/g, '')) || 0
  const countryEntry = COUNTRY_DATA[country]
  const categoryData = CATEGORIES.find(c => c.value === category)

  // ── Wait time range ────────────────────────────────────────────────────
  const minMonths = countryEntry && categoryData
    ? Math.round(countryEntry.minMonths * categoryData.mult)
    : 0
  const maxMonths = countryEntry && categoryData
    ? Math.round(countryEntry.maxMonths * categoryData.mult)
    : 0

  // ── Cost model ─────────────────────────────────────────────────────────
  // LOW scenario: employer allows remote work (partial income maintained), modest relocation
  // HIGH scenario: full job loss, family separation, full relocation
  const annualSalary = salaryNum

  // Income loss (LOW: 35% reduction — many employers allow partial remote work)
  const incomeLossLow  = annualSalary * (minMonths / 12) * 0.35
  // Income loss (HIGH: full loss for max months — employer terminates or won't allow remote)
  const incomeLossHigh = annualSalary * (maxMonths / 12) * 1.0

  // Career disruption: missed promotions, equity, seniority, network
  // LOW: 8% of annual (conservative — shorter disruption)
  // HIGH: 20% of annual (promotion cycle missed, team rebuilt around someone else)
  const careerLow  = annualSalary * 0.08
  const careerHigh = annualSalary * 0.20

  // Relocation + housing differential abroad
  // LOW: short trip, minimal family disruption ($15,000)
  // HIGH: full family relocation, temporary housing, school changes ($45,000)
  const relocLow  = 15_000
  const relocHigh = 45_000

  // Healthcare / insurance gap (US coverage lost while abroad)
  // LOW: 6 months gap ($6,000)
  // HIGH: full wait period at $18K/yr
  const healthLow  = 6_000
  const healthHigh = (maxMonths / 12) * 18_000

  // Spousal income disruption (if spouse also works in US)
  // LOW: spouse keeps job remotely ($0 impact)
  // HIGH: spouse also must leave or reduces hours ($30K lost)
  const spouseLow  = 0
  const spouseHigh = 30_000

  const totalLow  = incomeLossLow  + careerLow  + relocLow  + healthLow  + spouseLow
  const totalHigh = incomeLossHigh + careerHigh + relocHigh + healthHigh + spouseHigh

  const premiumProcessing = 2_805
  const reportCost = 497
  const totalInvestment = premiumProcessing + reportCost

  const roiLow  = totalInvestment > 0 ? Math.round(totalLow  / totalInvestment) : 0
  const roiHigh = totalInvestment > 0 ? Math.round(totalHigh / totalInvestment) : 0

  const canCompute = salaryNum > 0 && country && category && countryEntry?.tier !== 'blocked'

  const sortedCountries = Object.entries(COUNTRY_DATA).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <Link href="/stay-score" className="text-sm text-teal font-semibold hover:underline">← Exposure Score</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Financial Exposure Analysis
          </div>
          <h1 className="text-3xl font-black text-navy leading-tight">
            What Does Consular Processing<br />
            <span className="text-teal">Actually Cost You?</span>
          </h1>
          <p className="text-sm text-mid max-w-md mx-auto leading-relaxed">
            Most people focus on whether they qualify. Few do the math on what leaving the US
            actually costs — across income, career momentum, relocation, and family disruption.
            This calculator shows you both ends of the range.
          </p>
        </div>

        <div className="card space-y-5">
          {/* Salary */}
          <div>
            <label className="label">Your annual US compensation (salary + bonus)</label>
            <input className="input text-lg font-bold" placeholder="e.g. $180,000"
              value={salary}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '')
                setSalary(raw ? `$${parseInt(raw).toLocaleString()}` : '')
                setComputed(false)
              }}
            />
          </div>

          {/* Country */}
          <div>
            <label className="label">Your country of nationality</label>
            <select className="input" value={country} onChange={e => { setCountry(e.target.value); setComputed(false) }}>
              <option value="">Select country</option>
              <optgroup label="── Immigrant Visa Restrictions / Travel Ban ──">
                {sortedCountries.filter(([, v]) => v.tier === 'blocked').map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </optgroup>
              <optgroup label="── EB Priority Date Backlog ──">
                {sortedCountries.filter(([, v]) => v.tier === 'backlog').map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </optgroup>
              <optgroup label="── Consulate Open ──">
                {sortedCountries.filter(([, v]) => v.tier === 'open').map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </optgroup>
            </select>

            {countryEntry?.tier === 'blocked' && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-red-700">Consular processing is not currently available for your country.</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">
                  Under current policy, nationals of your country cannot complete consular processing for a green card.
                  Adjustment of status inside the US is your only viable path — which requires demonstrating extraordinary circumstances.
                  The financial and personal stakes of not having a strong AoS case are effectively incalculable.
                </p>
                <Link href="/login" className="inline-block mt-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors">
                  Build my AoS case now →
                </Link>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="label">Green card category you are pursuing</label>
            <select className="input" value={category} onChange={e => { setCategory(e.target.value); setComputed(false) }}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <button onClick={() => setComputed(true)} disabled={!canCompute}
            className="w-full btn-teal py-4 text-base font-bold disabled:opacity-40">
            Calculate my financial exposure →
          </button>
          <p className="text-xs text-center text-mid">Estimates shown as a range — real outcomes depend on your employer and family situation</p>
        </div>

        {computed && canCompute && countryEntry && (
          <div className="space-y-4">

            {/* Estimated Wait */}
            <div className="card border-2 border-amber-200 bg-amber-50 text-center space-y-2 py-6">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Estimated time outside the US</p>
              <p className="text-4xl font-black text-navy">{minMonths}–{maxMonths} months</p>
              <p className="text-sm text-mid">
                {countryEntry.tier === 'backlog'
                  ? 'Priority date backlog estimate for your nationality — actual wait may be significantly longer'
                  : `Typical consular processing timeline for ${category} applicants from open countries`}
              </p>
            </div>

            {/* Scenario toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
              {(['typical', 'worst'] as const).map(s => (
                <button key={s} onClick={() => setScenario(s)}
                  className={`flex-1 py-3 text-sm font-bold transition-all ${scenario === s ? 'bg-navy text-white' : 'text-mid hover:text-navy'}`}>
                  {s === 'typical' ? 'Conservative estimate' : 'Worst-case estimate'}
                </button>
              ))}
            </div>

            <p className="text-xs text-mid text-center">
              {scenario === 'typical'
                ? 'Conservative: assumes employer allows some remote work, shorter wait, minimal family disruption'
                : 'Worst-case: full job loss, maximum wait, complete family relocation, no remote work'}
            </p>

            {/* The number */}
            <div className="card bg-navy text-white text-center space-y-2 py-8">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">
                {scenario === 'typical' ? 'Conservative' : 'Worst-case'} financial exposure
              </p>
              <p className="text-6xl font-black text-white">
                {fmt(scenario === 'typical' ? totalLow : totalHigh)}
              </p>
              <p className="text-white/60 text-sm">
                Full range: <strong className="text-white/80">{fmtRange(totalLow, totalHigh)}</strong>
              </p>
            </div>

            {/* Breakdown */}
            <div className="card space-y-3">
              <p className="text-xs font-bold text-navy uppercase tracking-widest mb-1">Cost breakdown ({scenario === 'typical' ? 'conservative' : 'worst-case'})</p>
              {[
                {
                  label: scenario === 'typical'
                    ? `Income impact (${minMonths} months, 35% reduction — partial remote work assumed)`
                    : `Income impact (${maxMonths} months, full loss — employer doesn't allow remote)`,
                  value: scenario === 'typical' ? incomeLossLow : incomeLossHigh,
                  note: 'Whether your employer will allow remote work is the single biggest variable in this calculation',
                },
                {
                  label: 'Career disruption — missed promotions, equity, seniority',
                  value: scenario === 'typical' ? careerLow : careerHigh,
                  note: scenario === 'typical' ? '8% of annual comp (conservative — one cycle affected)' : '20% of annual comp (promotion cycle missed, team restructured around your absence)',
                },
                {
                  label: 'Relocation, housing, and setup abroad',
                  value: scenario === 'typical' ? relocLow : relocHigh,
                  note: scenario === 'typical' ? '$15K — solo trip, short-term housing' : '$45K — full family relocation, school transitions, temporary housing',
                },
                {
                  label: 'US healthcare coverage gap',
                  value: scenario === 'typical' ? healthLow : healthHigh,
                  note: scenario === 'typical' ? '$6K — ~6 months without US employer coverage' : `$${Math.round((maxMonths / 12) * 18).toLocaleString()}K — full wait period at $18K/year equivalent`,
                },
                {
                  label: "Spousal income disruption",
                  value: scenario === 'typical' ? spouseLow : spouseHigh,
                  note: scenario === 'typical' ? 'Conservative: spouse maintains US income remotely' : '$30K — spouse must also leave or significantly reduce hours',
                },
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy">{row.label}</p>
                    <p className="text-xs text-mid mt-0.5 leading-relaxed">{row.note}</p>
                  </div>
                  <p className="text-sm font-bold text-navy flex-shrink-0">{fmt(row.value)}</p>
                </div>
              ))}
            </div>

            {/* The comparison */}
            <div className="card border-2 border-teal space-y-4">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">The alternative: fight to stay</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Cost of leaving (range)</p>
                  <p className="text-2xl font-black text-red-500">{fmtRange(totalLow, totalHigh)}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Cost of fighting to stay</p>
                  <p className="text-3xl font-black text-teal">{fmt(totalInvestment)}</p>
                  <p className="text-[10px] text-mid">$2,805 premium processing + $497 evidence package</p>
                </div>
              </div>
              <div className="bg-teal/8 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-mid">Return on investment</p>
                <p className="text-4xl font-black text-navy">{roiLow}× – {roiHigh}×</p>
                <p className="text-sm text-mid">
                  Every dollar invested in your AoS case protects <strong className="text-navy">{roiLow}–{roiHigh} dollars</strong> of exposure
                </p>
              </div>
            </div>

            {/* What premium processing buys */}
            <div className="card space-y-3">
              <p className="text-sm font-bold text-navy">What premium processing actually provides</p>
              {[
                { pt: '45 business days',         detail: 'I-140 decision from filing — approximately 9 weeks' },
                { pt: 'Government certification', detail: 'An approved NIW I-140 is a formal USCIS finding that your work is of national importance' },
                { pt: 'AoS discretion evidence',  detail: 'The exact standard USCIS now uses to evaluate adjustment of status inside the US' },
                { pt: 'Priority date locked',      detail: 'Your place in line is fixed from the I-140 filing date regardless of future policy changes' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-teal font-bold flex-shrink-0 mt-0.5">→</span>
                  <div>
                    <span className="text-sm font-bold text-navy">{item.pt}: </span>
                    <span className="text-sm text-mid">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card bg-navy text-white text-center space-y-3">
              <p className="text-lg font-bold">Ready to build your evidence package?</p>
              <p className="text-sm text-white/70">Your full NIW strategy report includes the Dhanasar analysis, draft petition language, and the exact evidence USCIS needs to approve your adjustment of status.</p>
              <Link href="/login" className="inline-block bg-teal text-white font-bold px-8 py-3 rounded-xl hover:bg-teal/90 transition-colors">
                Get my evidence package — $497 →
              </Link>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-mid pb-4 space-y-1">
          <p>Estimates are illustrative ranges, not guarantees · Individual outcomes vary significantly · Not legal or financial advice</p>
          <p>Country data reflects PP 10998 (Jan 1 2026), State Dept immigrant visa pause (Jan 21 2026), and current EB visa bulletin priority dates</p>
          <p>
            <Link href="/stay-score" className="text-teal hover:underline">← Check your Exposure Score</Link>
            {' · '}
            <Link href="/cohort" className="text-teal hover:underline">Group filing program →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
