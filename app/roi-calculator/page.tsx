'use client'

import { useState } from 'react'
import Link from 'next/link'

const COUNTRY_WAIT: Record<string, { months: number; risk: 'paused' | 'backlog' | 'open'; label: string }> = {
  'India':        { months: 24, risk: 'backlog', label: 'India — severe EB backlog, 2–5+ year wait typical' },
  'China':        { months: 18, risk: 'backlog', label: 'China — significant backlog, 18+ month wait' },
  'Mexico':       { months: 12, risk: 'backlog', label: 'Mexico — backlog in several categories' },
  'Philippines':  { months: 12, risk: 'backlog', label: 'Philippines — backlog in several categories' },
  'Nigeria':      { months: 0,  risk: 'paused',  label: 'Nigeria — on immigrant visa pause (no processing)' },
  'Pakistan':     { months: 0,  risk: 'paused',  label: 'Pakistan — on immigrant visa pause (no processing)' },
  'Iran':         { months: 0,  risk: 'paused',  label: 'Iran — on immigrant visa pause (no processing)' },
  'Russia':       { months: 0,  risk: 'paused',  label: 'Russia — on immigrant visa pause (no processing)' },
  'Venezuela':    { months: 0,  risk: 'paused',  label: 'Venezuela — on immigrant visa pause (no processing)' },
  'Bangladesh':   { months: 0,  risk: 'paused',  label: 'Bangladesh — on immigrant visa pause (no processing)' },
  'Other (open)': { months: 9,  risk: 'open',    label: 'Other country — consulate open, typical 6–12 month wait' },
}

const CATEGORIES = [
  { value: 'eb2_niw', label: 'EB-2 NIW (National Interest Waiver)', waitMult: 1.0 },
  { value: 'eb1a',    label: 'EB-1A (Extraordinary Ability)',       waitMult: 0.8 },
  { value: 'eb2_adv', label: 'EB-2 PERM (Advanced Degree)',         waitMult: 1.2 },
  { value: 'eb3',     label: 'EB-3 (Skilled Worker)',               waitMult: 1.4 },
  { value: 'family',  label: 'Family-based',                        waitMult: 1.3 },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function ROICalculatorPage() {
  const [salary, setSalary] = useState('')
  const [country, setCountry] = useState('')
  const [category, setCategory] = useState('')
  const [computed, setComputed] = useState(false)

  const salaryNum = parseInt(salary.replace(/\D/g, '')) || 0
  const countryData = COUNTRY_WAIT[country]
  const categoryData = CATEGORIES.find(c => c.value === category)

  const estimatedMonths = countryData && categoryData
    ? Math.round(countryData.months * categoryData.waitMult)
    : 0

  const incomeLoss = salaryNum * (estimatedMonths / 12)
  const careerDisruption = salaryNum * 0.20  // career setback cost
  const relocCost = 8000  // conservative relocation + housing abroad
  const totalExposure = incomeLoss + careerDisruption + relocCost

  const premiumProcessing = 2805
  const reportCost = 497
  const totalInvestment = premiumProcessing + reportCost

  const roi = totalInvestment > 0 ? Math.round((totalExposure / totalInvestment) * 100) : 0
  const multiplier = totalInvestment > 0 ? (totalExposure / totalInvestment).toFixed(0) : '0'

  const canCompute = salaryNum > 0 && country && category && countryData?.risk !== 'paused'

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
            The Math Nobody Is Showing You
          </div>
          <h1 className="text-3xl font-black text-navy leading-tight">
            How Much Does It <em>Really</em> Cost<br />
            <span className="text-teal">to Leave the US?</span>
          </h1>
          <p className="text-sm text-mid max-w-md mx-auto leading-relaxed">
            Under the current and evolving immigration policy environment, consular processing means months or years outside the US.
            Calculate your actual financial exposure — and compare it to the cost of proactively protecting your position.
          </p>
        </div>

        <div className="card space-y-5">
          {/* Salary */}
          <div>
            <label className="label">Your annual US salary</label>
            <input
              className="input text-lg font-bold"
              placeholder="e.g. $180,000"
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
              {Object.entries(COUNTRY_WAIT).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {countryData?.risk === 'paused' && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-red-700">Consular processing is subject to significant restrictions for your country of nationality.</p>
                <p className="text-xs text-red-600 mt-1">Adjustment of status inside the US is likely your most viable path — which requires demonstrating extraordinary circumstances. Given this, your ROI for filing NIW with premium processing is effectively incalculable.</p>
                <Link href="/login" className="inline-block mt-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors">
                  Build my AoS case now →
                </Link>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="label">Green card category</label>
            <select className="input" value={category} onChange={e => { setCategory(e.target.value); setComputed(false) }}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <button
            onClick={() => setComputed(true)}
            disabled={!canCompute}
            className="w-full btn-teal py-4 text-base font-bold disabled:opacity-40"
          >
            Calculate my exposure →
          </button>
        </div>

        {computed && canCompute && (
          <div className="space-y-4">

            {/* The number */}
            <div className="card bg-navy text-white text-center space-y-2 py-8">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">Your estimated cost of consular processing</p>
              <p className="text-6xl font-black text-white">{fmt(totalExposure)}</p>
              <p className="text-white/60 text-sm">Over approximately {estimatedMonths} months outside the US</p>
            </div>

            {/* Breakdown */}
            <div className="card space-y-3">
              <p className="text-xs font-bold text-navy uppercase tracking-widest mb-1">How we get there</p>
              {[
                { label: `Lost income (${estimatedMonths} months at ${fmt(salaryNum)}/yr)`, value: incomeLoss, note: 'Salary you cannot earn while processing abroad' },
                { label: 'Career disruption cost', value: careerDisruption, note: 'Lost promotions, network, seniority (estimated 20% of annual salary)' },
                { label: 'Relocation + housing abroad', value: relocCost, note: 'Conservative estimate for temporary relocation' },
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-navy">{row.label}</p>
                    <p className="text-xs text-mid">{row.note}</p>
                  </div>
                  <p className="text-sm font-bold text-navy flex-shrink-0">{fmt(row.value)}</p>
                </div>
              ))}
            </div>

            {/* The comparison */}
            <div className="card border-2 border-teal space-y-4">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">The alternative</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Cost of leaving</p>
                  <p className="text-3xl font-black text-red-500">{fmt(totalExposure)}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Cost of fighting to stay</p>
                  <p className="text-3xl font-black text-teal">{fmt(totalInvestment)}</p>
                  <p className="text-[10px] text-mid">($2,805 premium processing + $497 evidence package)</p>
                </div>
              </div>

              <div className="bg-teal/8 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-mid">Return on investment</p>
                <p className="text-4xl font-black text-navy">{multiplier}×</p>
                <p className="text-sm text-mid">Every dollar spent fighting to stay saves you <strong className="text-navy">{multiplier} dollars</strong> in exposure</p>
              </div>
            </div>

            {/* What premium processing buys */}
            <div className="card space-y-3">
              <p className="text-sm font-bold text-navy">What the $2,805 premium processing investment actually buys</p>
              {[
                { point: '45 business days', detail: 'I-140 decision — roughly 9 weeks from filing' },
                { point: 'Government certification', detail: 'An approved NIW I-140 is a formal finding that your work is of national importance' },
                { point: 'Extraordinary circumstances evidence', detail: 'The exact standard USCIS now uses to approve adjustment of status inside the US' },
                { point: 'Priority date preservation', detail: 'Your place in line is locked from I-140 filing date regardless of policy changes' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-teal font-bold flex-shrink-0 mt-0.5">→</span>
                  <div>
                    <span className="text-sm font-bold text-navy">{item.point}: </span>
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
          <p>Calculations are estimates for illustrative purposes only · Not legal or financial advice</p>
          <p>Based on current USCIS policy guidance · Policy landscape is actively evolving</p>
          <p><Link href="/stay-score" className="text-teal hover:underline">← Calculate your Exposure Score</Link> · <Link href="/cohort" className="text-teal hover:underline">Group filing program →</Link></p>
        </div>
      </div>
    </div>
  )
}
