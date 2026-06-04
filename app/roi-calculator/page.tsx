'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  COUNTRY_DATA,
  TIER_ORDER,
  TIER_GROUP_LABELS,
  TIERS_LAST_VERIFIED,
  type Tier,
} from '@/lib/country-tiers'

// ─── Green card categories ─────────────────────────────────────────────────
// mult: adjustment to the base consular/backlog timeline
const CATEGORIES = [
  { value: 'eb1a',    label: 'EB-1A (Extraordinary Ability)',       mult: 0.8 },
  { value: 'eb2_niw', label: 'EB-2 NIW (National Interest Waiver)', mult: 1.0 },
  { value: 'eb2_adv', label: 'EB-2 PERM (Advanced Degree)',         mult: 1.4 },
  { value: 'eb3',     label: 'EB-3 (Skilled Worker)',               mult: 1.6 },
  { value: 'family',  label: 'Family-based',                        mult: 1.3 },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
function fmtRange(lo: number, hi: number) {
  return `${fmt(lo)} - ${fmt(hi)}`
}

// ─── Grouped country list for the <select> ─────────────────────────────────
const GROUPED_COUNTRIES = TIER_ORDER.map(tier => ({
  tier,
  label: TIER_GROUP_LABELS[tier],
  entries: Object.entries(COUNTRY_DATA)
    .filter(([, v]) => v.tier === tier)
    .sort(([a], [b]) => a.localeCompare(b)),
}))

// ─── Exposure model ────────────────────────────────────────────────────────
//
//  The question this calculator answers:
//  "What is the financial cost of NOT having an approved NIW I-140 today?"
//
//  IMPORTANT: a closed consular path increases exposure, it does not reduce it.
//
//  • 'open'   , if status disrupted, you can leave and return via consulate.
//                Exposure = months outside US × income impact + relocation.
//
//  • 'backlog', consulate works but EB queue = years of career mobility loss
//                even with approved I-140. Exposure = backlog wait cost.
//
//  • 'blocked', consular processing is SUSPENDED. AoS is your only path.
//                No fallback if you lose status. Exposure multiplier rises.
//
//  • 'ban'    , NO consular path. If you leave or lose status you may be
//                PERMANENTLY unable to return via immigrant visa.
//                Exposure = career preservation value at risk, not trip length.
//
function computeExposure(annualSalary: number, tier: Tier, minM: number, maxM: number) {
  const mo = annualSalary / 12

  if (tier === 'open') {
    // Conservative: partial remote, shorter timeline
    const incomeLow  = mo * minM * 0.35
    const incomeHigh = mo * maxM * 1.0
    const careerLow  = annualSalary * 0.08
    const careerHigh = annualSalary * 0.20
    const relocLow   = 15_000
    const relocHigh  = 45_000
    const healthLow  = 6_000
    const healthHigh = Math.round(mo * maxM * 0.10)
    const spouseLow  = 0
    const spouseHigh = 30_000
    return {
      rows: [
        {
          label: `Income impact, ${minM}–${maxM} months outside the US`,
          conservative: incomeLow,
          worst: incomeHigh,
          noteConservative: `${minM} months at 35% reduction, employer allows partial remote during consular processing`,
          noteWorst: `${maxM} months at full loss, employer cannot hold the role during processing`,
        },
        {
          label: 'Career disruption, promotions, equity, seniority',
          conservative: careerLow,
          worst: careerHigh,
          noteConservative: '8% of annual comp, one performance cycle affected',
          noteWorst: '20% of annual comp, promotion missed, equity unvested, team restructured',
        },
        {
          label: 'Relocation, housing, and setup costs',
          conservative: relocLow,
          worst: relocHigh,
          noteConservative: '$15K, solo trip, short-term housing',
          noteWorst: '$45K, full family relocation, school transitions, storage',
        },
        {
          label: 'Healthcare and insurance coverage gap',
          conservative: healthLow,
          worst: healthHigh,
          noteConservative: '$6K, approximately 6 months without US employer coverage',
          noteWorst: `${fmt(healthHigh)}, full ${maxM}-month gap`,
        },
        {
          label: 'Spousal income and career disruption',
          conservative: spouseLow,
          worst: spouseHigh,
          noteConservative: 'Conservative: spouse maintains US employment remotely',
          noteWorst: '$30K, spouse must also leave or take career pause',
        },
      ],
      totalLow:  incomeLow + careerLow + relocLow + healthLow + spouseLow,
      totalHigh: incomeHigh + careerHigh + relocHigh + healthHigh + spouseHigh,
      exposureLabel: 'Estimated cost if forced through consular processing',
      timelineLabel: `Estimated processing timeline: ${minM}–${maxM} months outside the US`,
    }
  }

  if (tier === 'backlog') {
    // Backlog = career mobility cost + possible forced departure into long wait
    const mobilityLow  = annualSalary * (minM / 12) * 0.30  // ~30% of annual per year locked to employer
    const mobilityHigh = annualSalary * (maxM / 12) * 0.45
    const compGapLow   = annualSalary * 0.10  // comp gap vs. peers who have GC
    const compGapHigh  = annualSalary * 0.25
    const relocLow     = 15_000
    const relocHigh    = 50_000
    const healthLow    = 12_000
    const healthHigh   = Math.round(mo * maxM * 0.12)
    const spouseLow    = 0
    const spouseHigh   = 40_000
    return {
      rows: [
        {
          label: `Career mobility cost, ${minM}–${maxM} months locked to sponsoring employer`,
          conservative: mobilityLow,
          worst: mobilityHigh,
          noteConservative: `${minM} months unable to freely change jobs, estimated at 30% of annual comp lost in missed opportunities`,
          noteWorst: `${maxM} months (full backlog wait), locked to current employer or forced restart, 45% annual comp equivalent`,
        },
        {
          label: 'Compensation gap vs. peers with unrestricted work authorization',
          conservative: compGapLow,
          worst: compGapHigh,
          noteConservative: '10% of annual comp, limited negotiating leverage without GC',
          noteWorst: '25% of annual comp, missed offers, suppressed raises, constrained mobility',
        },
        {
          label: 'Relocation and departure costs if status disrupted',
          conservative: relocLow,
          worst: relocHigh,
          noteConservative: '$15K, solo departure if forced to leave',
          noteWorst: '$50K, full family relocation, school transitions',
        },
        {
          label: 'Healthcare gap during any departure',
          conservative: healthLow,
          worst: healthHigh,
          noteConservative: '$12K, one year without employer coverage',
          noteWorst: `${fmt(healthHigh)}, full backlog duration gap`,
        },
        {
          label: 'Spousal career disruption',
          conservative: spouseLow,
          worst: spouseHigh,
          noteConservative: 'Conservative: spouse maintains US employment',
          noteWorst: '$40K, spouse dependent on your status',
        },
      ],
      totalLow:  mobilityLow + compGapLow + relocLow + healthLow + spouseLow,
      totalHigh: mobilityHigh + compGapHigh + relocHigh + healthHigh + spouseHigh,
      exposureLabel: 'Career value at risk during EB backlog wait',
      timelineLabel: `Estimated priority date wait: ${minM}–${maxM} months`,
    }
  }

  if (tier === 'blocked') {
    // Blocked = no consular fallback. AoS-only. Higher multiplier than open.
    // Losing status = far worse outcome because you cannot process abroad.
    const incomeLow  = mo * minM * 0.65  // higher than open, no fallback path
    const incomeHigh = mo * maxM * 1.20  // over 100% because extended limbo likely
    const careerLow  = annualSalary * 0.15
    const careerHigh = annualSalary * 0.35
    const relocLow   = 20_000
    const relocHigh  = 60_000
    const healthLow  = 10_000
    const healthHigh = Math.round(mo * maxM * 0.12)
    const spouseLow  = 5_000
    const spouseHigh = 45_000
    return {
      rows: [
        {
          label: `Income at risk, ${minM}–${maxM} month exposure window (no consular fallback)`,
          conservative: incomeLow,
          worst: incomeHigh,
          noteConservative: `${minM} months at 65% impact, consular processing is paused, so extended AoS limbo is likely if status disrupted`,
          noteWorst: `${maxM} months at 120%, forced departure with no defined return path; continued income may require leaving US employment entirely`,
        },
        {
          label: 'Career disruption, no consular fallback amplifies every setback',
          conservative: careerLow,
          worst: careerHigh,
          noteConservative: '15% of annual comp, position at risk while IV pause is in effect',
          noteWorst: '35% of annual comp, career restart in home country or extended gap',
        },
        {
          label: 'Relocation and housing',
          conservative: relocLow,
          worst: relocHigh,
          noteConservative: '$20K, forced departure into indefinite wait',
          noteWorst: '$60K, full family relocation, uncertain return timeline',
        },
        {
          label: 'Healthcare gap (IV pause has no published end date)',
          conservative: healthLow,
          worst: healthHigh,
          noteConservative: '$10K, conservative 12-month gap',
          noteWorst: `${fmt(healthHigh)}, full ${maxM}-month exposure`,
        },
        {
          label: 'Spousal disruption, uncertainty compounds across household',
          conservative: spouseLow,
          worst: spouseHigh,
          noteConservative: '$5K, limited disruption if spouse has independent status',
          noteWorst: '$45K, household income at risk',
        },
      ],
      totalLow:  incomeLow + careerLow + relocLow + healthLow + spouseLow,
      totalHigh: incomeHigh + careerHigh + relocHigh + healthHigh + spouseHigh,
      exposureLabel: 'Exposure without a fallback path, consular processing is paused',
      timelineLabel: `IV pause planning estimate: ${minM}–${maxM} months (no end date published)`,
    }
  }

  // tier === 'ban'
  // MAXIMUM exposure. No consular path at all.
  // If you leave or lose status: there is NO immigrant visa path back via a consulate.
  // This is not about "time outside the US", it is about career preservation.
  // The conservative scenario: you maintain status, but carry full career risk with zero safety net.
  // The worst-case scenario: status disrupted → forced departure → no return path → career loss.
  const careerYears   = 10  // planning horizon: 10 years of US career at risk
  const incomeLow     = annualSalary * careerYears * 0.30  // 30% of 10-yr career at risk (conservative)
  const incomeHigh    = annualSalary * careerYears * 0.80  // 80%, forced departure likely = most of career
  const careerLow     = annualSalary * 0.25
  const careerHigh    = annualSalary * 0.60
  const relocLow      = 20_000
  const relocHigh     = 75_000
  const healthLow     = 15_000
  const healthHigh    = Math.round(annualSalary * 0.06)
  const spouseLow     = 10_000
  const spouseHigh    = 60_000
  return {
    rows: [
      {
        label: `Career income at risk, full travel ban means no consular return path`,
        conservative: incomeLow,
        worst: incomeHigh,
        noteConservative: `30% of a 10-year career horizon, the minimum planning exposure when you have no immigrant visa fallback`,
        noteWorst: `80% of a 10-year career horizon, if status is disrupted, nationals of your country cannot obtain a new immigrant visa through any consulate. US career may be unrecoverable.`,
      },
      {
        label: 'Career disruption and permanent mobility loss',
        conservative: careerLow,
        worst: careerHigh,
        noteConservative: '25% of annual comp, every promotion, offer, and equity decision affected under full ban',
        noteWorst: '60% of annual comp, career restart in home country, permanent US career loss',
      },
      {
        label: 'Relocation and one-way departure costs',
        conservative: relocLow,
        worst: relocHigh,
        noteConservative: '$20K, minimal forced departure',
        noteWorst: '$75K, full family relocation; under a full ban, this may be permanent',
      },
      {
        label: 'Healthcare, insurance, and benefits gap',
        conservative: healthLow,
        worst: healthHigh,
        noteConservative: '$15K, minimum gap estimate under an indefinite ban',
        noteWorst: `${fmt(healthHigh)}, ongoing, open-ended`,
      },
      {
        label: 'Spousal and family income disruption',
        conservative: spouseLow,
        worst: spouseHigh,
        noteConservative: '$10K, household disruption under ban conditions',
        noteWorst: '$60K, household income likely follows forced departure',
      },
    ],
    totalLow:  incomeLow + careerLow + relocLow + healthLow + spouseLow,
    totalHigh: incomeHigh + careerHigh + relocHigh + healthHigh + spouseHigh,
    exposureLabel: 'Career preservation value at risk, full ban, no consular return path',
    timelineLabel: `Full travel ban, no consular processing available for nationals of your country`,
  }
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function ROICalculatorPage() {
  const [salary, setSalary]         = useState('')
  const [countryKey, setCountryKey] = useState('')
  const [countryInput, setCountryInput] = useState('') // typed value for "Other"
  const [isOther, setIsOther]       = useState(false)
  const [category, setCategory]     = useState('')
  const [scenario, setScenario]     = useState<'conservative' | 'worst'>('conservative')
  const [computed, setComputed]     = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [snapshotSaved, setSnapshotSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
  }, [])

  const salaryNum = parseInt(salary.replace(/\D/g, '')) || 0

  // Resolve country entry: named entry, or 'open' default for free-typed "Other"
  const countryEntry = isOther
    ? { tier: 'open' as Tier, minMonths: 9, maxMonths: 18, label: countryInput || 'Other', policyNote: undefined }
    : (countryKey ? COUNTRY_DATA[countryKey] : undefined)

  const categoryData = CATEGORIES.find(c => c.value === category)

  const minMonths = countryEntry && categoryData
    ? Math.round(countryEntry.minMonths * categoryData.mult)
    : 0
  const maxMonths = countryEntry && categoryData
    ? Math.round(countryEntry.maxMonths * categoryData.mult)
    : 0

  const exposure = (salaryNum > 0 && countryEntry && categoryData)
    ? computeExposure(salaryNum, countryEntry.tier, minMonths, maxMonths)
    : null

  const totalLow  = exposure?.totalLow  ?? 0
  const totalHigh = exposure?.totalHigh ?? 0

  const premiumProcessing = 2_805
  const reportCost        = 297
  const totalInvestment   = premiumProcessing + reportCost

  const roiLow  = totalInvestment > 0 ? Math.round(totalLow  / totalInvestment) : 0
  const roiHigh = totalInvestment > 0 ? Math.round(totalHigh / totalInvestment) : 0

  const canCompute = salaryNum > 0 && (countryKey || isOther) && category

  const tier = countryEntry?.tier ?? 'open'
  const tierColors: Record<Tier, { bg: string; border: string; text: string; badge: string }> = {
    ban:     { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badge: 'bg-red-100 text-red-800' },
    blocked: { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-800' },
    backlog: { bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800' },
    open:    { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-800' },
  }
  const tc = tierColors[tier]

  const tierRiskLabels: Record<Tier, string> = {
    ban:     'MAXIMUM RISK, No consular path',
    blocked: 'HIGH RISK, Consular processing suspended',
    backlog: 'ELEVATED RISK, EB backlog',
    open:    'BASELINE, Consulate operational',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <Link href="/stay-score" className="text-sm text-teal font-semibold hover:underline">← Risk Score</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Financial Exposure Analysis
          </div>
          <h1 className="text-3xl font-black text-navy leading-tight">
            What Does Delaying Your Green Card<br />
            <span className="text-teal">Actually Cost You?</span>
          </h1>
          <p className="text-sm text-mid max-w-md mx-auto leading-relaxed">
            This calculator estimates what's at risk if you don't have an approved NIW I-140 today.
            A closed consular path means higher exposure, not lower. Your country's situation
            determines how much career value you are currently carrying unprotected.
          </p>
        </div>

        {/* Inputs */}
        <div className="card space-y-5">

          <div>
            <label className="label">Annual US compensation (salary + bonus)</label>
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

          <div className="space-y-2">
            <label className="label">Country of nationality</label>
            <select
              className="input"
              value={isOther ? '__other__' : countryKey}
              onChange={e => {
                const val = e.target.value
                if (val === '__other__') {
                  setIsOther(true)
                  setCountryKey('')
                } else {
                  setIsOther(false)
                  setCountryKey(val)
                  setCountryInput('')
                }
                setComputed(false)
              }}
            >
              <option value="">Select your country</option>
              {GROUPED_COUNTRIES.map(group => (
                <optgroup key={group.tier} label={group.label}>
                  {group.entries.map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </optgroup>
              ))}
              <option value="__other__">── Other / Not listed, type below ──</option>
            </select>

            {isOther && (
              <div className="space-y-1">
                <input
                  className="input"
                  placeholder="Type your country name..."
                  value={countryInput}
                  onChange={e => { setCountryInput(e.target.value); setComputed(false) }}
                  autoFocus
                />
                <p className="text-xs text-mid leading-relaxed">
                  Your country isn't in our database, we'll use standard consular processing estimates.
                  If your country has travel or visa restrictions not reflected here, your actual exposure
                  may be higher. Email <a href="mailto:support@f-1careers.com" className="text-teal hover:underline">support@f-1careers.com</a> to request it be added.
                </p>
              </div>
            )}

            {/* Tier warning banner */}
            {countryEntry && (
              <div className={`rounded-xl px-4 py-3 space-y-1 border ${tc.bg} ${tc.border}`}>
                <p className={`text-sm font-bold ${tc.text}`}>{tierRiskLabels[tier]}</p>
                {countryEntry.policyNote && (
                  <p className={`text-xs leading-relaxed ${tc.text} opacity-80`}>
                    {countryEntry.policyNote}
                    {tier === 'ban' && ', no immigrant visa consular path available. AoS is your only option. Any status disruption may be permanent.'}
                    {tier === 'blocked' && ', no immigrant visa consular processing right now. AoS-only. No fallback if status is disrupted.'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="label">Green card category you are pursuing</label>
            <select className="input" value={category} onChange={e => { setCategory(e.target.value); setComputed(false) }}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <button
            onClick={() => {
              setComputed(true)
              if (isLoggedIn && canCompute && countryEntry) {
                fetch('/api/tools/snapshot', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tool: 'roi',
                    data: {
                      country: countryEntry.label,
                      tier: countryEntry.tier,
                      salary: salaryNum,
                      category,
                    },
                  }),
                }).then(() => setSnapshotSaved(true)).catch(() => {})
              }
            }}
            disabled={!canCompute}
            className="w-full btn-teal py-4 text-base font-bold disabled:opacity-40"
          >
            Calculate my financial exposure →
          </button>
          <p className="text-xs text-center text-mid">
            Shown as a range, outcomes depend on your employer, family situation, and whether policy changes
          </p>
        </div>

        {/* Results */}
        {computed && canCompute && countryEntry && exposure && (
          <div className="space-y-4">

            {/* Saved indicator */}
            {snapshotSaved && (
              <div className="flex items-center justify-between bg-teal/8 border border-teal/20 rounded-xl px-4 py-2.5">
                <p className="text-xs text-teal font-semibold">✓ Calculation saved to your profile</p>
                <Link href="/profile" className="text-xs text-teal underline font-semibold">View →</Link>
              </div>
            )}
            {!snapshotSaved && !isLoggedIn && (
              <div className="flex items-center justify-between bg-gray-50 border border-border rounded-xl px-4 py-2.5">
                <p className="text-xs text-mid">Save this calculation to your profile</p>
                <Link href="/signup" className="text-xs text-teal underline font-semibold">Create free account →</Link>
              </div>
            )}

            {/* Timeline / Risk card */}
            <div className={`card border-2 text-center space-y-2 py-6 ${tc.bg} ${tc.border}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${tc.text}`}>
                {tier === 'ban'    ? 'Career at risk, no consular path' :
                 tier === 'blocked'? 'Consular path suspended' :
                 tier === 'backlog'? 'EB priority date backlog' :
                                    'Estimated consular processing window'}
              </p>
              {tier === 'ban' ? (
                <>
                  <p className={`text-2xl font-black ${tc.text}`}>Consular processing: UNAVAILABLE</p>
                  <p className={`text-sm max-w-sm mx-auto leading-relaxed ${tc.text} opacity-80`}>
                    Full travel ban in effect. If you leave or lose status, nationals of your country cannot
                    currently obtain a new immigrant visa at any consulate. Adjustment of Status inside the
                    US is your only path to a green card. The exposure below reflects career preservation
                    value at risk, not time outside the US.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black text-navy">{minMonths}–{maxMonths} months</p>
                  <p className={`text-sm max-w-sm mx-auto leading-relaxed ${tc.text} opacity-80`}>
                    {tier === 'blocked'
                      ? `Planning estimate only, immigrant visa pause has no published end date. Actual exposure is open-ended.`
                      : tier === 'backlog'
                      ? `Priority date backlog estimate, actual wait depends on annual EB visa bulletin movement.`
                      : `Typical consular processing window for this category and nationality.`}
                  </p>
                </>
              )}
            </div>

            {/* Scenario toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
              {(['conservative', 'worst'] as const).map(s => (
                <button key={s} onClick={() => setScenario(s)}
                  className={`flex-1 py-3 text-sm font-bold transition-all ${scenario === s ? 'bg-navy text-white' : 'text-mid hover:text-navy'}`}>
                  {s === 'conservative' ? 'Conservative estimate' : 'Worst-case estimate'}
                </button>
              ))}
            </div>
            <p className="text-xs text-mid text-center">
              {scenario === 'conservative'
                ? 'Conservative: minimum realistic impact, employer cooperative, shorter timeline'
                : 'Worst-case: full status disruption, job loss, family relocation, no return path'}
            </p>

            {/* Total exposure headline */}
            <div className={`card border-2 text-center space-y-2 py-8 ${scenario === 'worst' ? 'bg-navy text-white' : ''}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${scenario === 'worst' ? 'text-teal' : 'text-navy'}`}>
                {scenario === 'conservative' ? 'Conservative' : 'Worst-case'} financial exposure
              </p>
              <p className={`text-6xl font-black ${scenario === 'worst' ? 'text-white' : 'text-navy'}`}>
                {fmt(scenario === 'conservative' ? totalLow : totalHigh)}
              </p>
              <p className={`text-sm ${scenario === 'worst' ? 'text-white/60' : 'text-mid'}`}>
                Full range: <strong className={scenario === 'worst' ? 'text-white/80' : 'text-navy'}>{fmtRange(totalLow, totalHigh)}</strong>
              </p>
              <p className={`text-xs pt-1 ${scenario === 'worst' ? 'text-white/50' : 'text-mid'}`}>
                {exposure.exposureLabel}
              </p>
              {tier === 'ban' && (
                <p className="text-xs text-red-400 pt-1 font-semibold">
                  Full ban: if status is disrupted without an approved I-140, this figure may represent permanent career loss, not a temporary disruption.
                </p>
              )}
            </div>

            {/* Cost breakdown */}
            <div className="card space-y-3">
              <p className="text-xs font-bold text-navy uppercase tracking-widest mb-1">
                Cost breakdown, {scenario === 'conservative' ? 'conservative' : 'worst-case'}
              </p>
              {exposure.rows.map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy">{row.label}</p>
                    <p className="text-xs text-mid mt-0.5 leading-relaxed">
                      {scenario === 'conservative' ? row.noteConservative : row.noteWorst}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-navy flex-shrink-0">
                    {fmt(scenario === 'conservative' ? row.conservative : row.worst)}
                  </p>
                </div>
              ))}
            </div>

            {/* The alternative */}
            <div className="card border-2 border-teal space-y-4">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">The alternative: build your AoS case now</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Exposure without I-140 (range)</p>
                  <p className="text-2xl font-black text-red-500">{fmtRange(totalLow, totalHigh)}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Cost to build your AoS case</p>
                  <p className="text-3xl font-black text-teal">{fmt(totalInvestment)}</p>
                  <p className="text-[10px] text-mid">$2,805 premium processing + $297 evidence package</p>
                </div>
              </div>
              <div className="bg-teal/8 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-mid">Return on investment (cost of protection vs. cost of exposure)</p>
                <p className="text-4xl font-black text-navy">{roiLow}× - {roiHigh}×</p>
                <p className="text-sm text-mid">
                  Every dollar invested in your NIW protects <strong className="text-navy">{roiLow}–{roiHigh} dollars</strong> of career value
                </p>
              </div>
            </div>

            {/* What I-140 provides */}
            <div className="card space-y-3">
              <p className="text-sm font-bold text-navy">What an approved NIW I-140 actually gives you</p>
              {[
                { pt: '45 business days', detail: 'I-140 decision via premium processing, approximately 9 weeks from filing' },
                { pt: 'USCIS certification', detail: 'A formal finding that your work is in the national interest, the strongest evidence for adjustment of status under PM-602-0199\'s "extraordinary circumstances" standard' },
                { pt: 'Priority date locked', detail: 'Your place in line is fixed from the I-140 filing date, immune to future policy changes' },
                { pt: 'AoS protection', detail: tier === 'ban'
                  ? 'With a travel ban in effect, this is your only green card path. Without it, you are entirely unprotected.'
                  : 'Allows you to stay in the US and adjust status without relying on consular processing' },
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

            {/* CTA */}
            <div className="card bg-navy text-white text-center space-y-3">
              <p className="text-lg font-bold">Ready to build your evidence package?</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Your full NIW strategy report includes the Dhanasar analysis, draft petition language,
                and the exact evidence map USCIS needs to approve your adjustment of status.
              </p>
              <Link href="/login" className="inline-block bg-teal text-white font-bold px-8 py-3 rounded-xl hover:bg-teal/90 transition-colors">
                Get my evidence package, $297 →
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-mid pb-4 space-y-1">
          <p>Estimates are illustrative ranges, not guarantees. Individual outcomes vary significantly. Not legal or financial advice.</p>
          <p>
            Country policy data last verified: <strong>{TIERS_LAST_VERIFIED}</strong>.
            Sources: PP 10998 (Jan 1, 2026) · State Dept immigrant visa pause (Jan 21, 2026) · USCIS EB Visa Bulletin (May 2026).
            Policy changes frequently, verify current status at <a href="https://travel.state.gov" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">travel.state.gov</a>.
          </p>
          <p>
            <Link href="/stay-score" className="text-teal hover:underline">← Check your Risk Score</Link>
            {' · '}
            <Link href="/cohort" className="text-teal hover:underline">Group filing program →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
