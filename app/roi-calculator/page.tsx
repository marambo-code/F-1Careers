'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Country data ──────────────────────────────────────────────────────────
// 'ban'      — full travel ban (PP 10998): no consular path; effectively indefinite
// 'blocked'  — immigrant visa pause (State Dept Jan 2026): pause could lift, but no timeline
// 'backlog'  — EB priority date backlog: years-long wait
// 'open'     — consulate operational: standard processing applies
//
// For ban/blocked: months represent planning estimates, not guarantees.
// Actual exposure may be open-ended if policy does not change.

type Tier = 'ban' | 'blocked' | 'backlog' | 'open'
type CountryEntry = { tier: Tier; minMonths: number; maxMonths: number; label: string }

const COUNTRY_DATA: Record<string, CountryEntry> = {

  // ── Full Travel Ban (PP 10998) — effectively indefinite ───────────────────
  'Afghanistan':        { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Afghanistan — full travel ban & visa suspension (PP 10998)' },
  'Burma / Myanmar':    { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Burma / Myanmar — full travel ban & visa suspension (PP 10998)' },
  'Burkina Faso':       { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Burkina Faso — full travel ban & visa suspension (PP 10998)' },
  'Chad':               { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Chad — full travel ban & visa suspension (PP 10998)' },
  'Republic of Congo':  { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Republic of Congo — full travel ban & visa suspension (PP 10998)' },
  'Equatorial Guinea':  { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Equatorial Guinea — full travel ban & visa suspension (PP 10998)' },
  'Eritrea':            { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Eritrea — full travel ban & visa suspension (PP 10998)' },
  'Haiti':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Haiti — full travel ban & visa suspension (PP 10998)' },
  'Iran':               { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Iran — full travel ban & visa suspension (PP 10998)' },
  'Laos':               { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Laos — full travel ban & visa suspension (PP 10998)' },
  'Libya':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Libya — full travel ban & visa suspension (PP 10998)' },
  'Mali':               { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Mali — full travel ban & visa suspension (PP 10998)' },
  'Niger':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Niger — full travel ban & visa suspension (PP 10998)' },
  'Sierra Leone':       { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Sierra Leone — full travel ban & visa suspension (PP 10998)' },
  'Somalia':            { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Somalia — full travel ban & visa suspension (PP 10998)' },
  'South Sudan':        { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'South Sudan — full travel ban & visa suspension (PP 10998)' },
  'Sudan':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Sudan — full travel ban & visa suspension (PP 10998)' },
  'Syria':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Syria — full travel ban & visa suspension (PP 10998)' },
  'Yemen':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Yemen — full travel ban & visa suspension (PP 10998)' },

  // ── Partial Travel Ban + IV Pause ─────────────────────────────────────────
  'Cuba':               { tier: 'ban', minMonths: 24, maxMonths: 84, label: 'Cuba — partial travel ban + immigrant visa restrictions' },
  'Venezuela':          { tier: 'ban', minMonths: 24, maxMonths: 84, label: 'Venezuela — partial travel ban + immigrant visa restrictions' },
  'Nigeria':            { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Nigeria — partial travel ban + immigrant visa pause' },
  'Tanzania':           { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Tanzania — partial travel ban + immigrant visa pause' },
  'Senegal':            { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Senegal — partial travel ban + immigrant visa pause' },
  'Ivory Coast':        { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Ivory Coast — partial travel ban + immigrant visa pause' },
  'Gambia':             { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Gambia — partial travel ban + immigrant visa pause' },
  'Togo':               { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Togo — partial travel ban + immigrant visa pause' },

  // ── Partial Travel Ban (no IV pause) ─────────────────────────────────────
  'Angola':             { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Angola — partial travel ban (PP 10998)' },
  'Benin':              { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Benin — partial travel ban (PP 10998)' },
  'Burundi':            { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Burundi — partial travel ban (PP 10998)' },
  'Gabon':              { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Gabon — partial travel ban (PP 10998)' },
  'Malawi':             { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Malawi — partial travel ban (PP 10998)' },
  'Mauritania':         { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Mauritania — partial travel ban (PP 10998)' },
  'Tonga':              { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Tonga — partial travel ban (PP 10998)' },
  'Turkmenistan':       { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Turkmenistan — partial travel ban (PP 10998)' },
  'Zambia':             { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Zambia — partial travel ban (PP 10998)' },
  'Zimbabwe':           { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Zimbabwe — partial travel ban (PP 10998)' },

  // ── Immigrant Visa Pause (State Dept, Jan 2026) ───────────────────────────
  'Algeria':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Algeria — immigrant visa processing paused (Jan 2026)' },
  'Albania':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Albania — immigrant visa processing paused (Jan 2026)' },
  'Armenia':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Armenia — immigrant visa processing paused (Jan 2026)' },
  'Azerbaijan':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Azerbaijan — immigrant visa processing paused (Jan 2026)' },
  'Bahamas':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bahamas — immigrant visa processing paused (Jan 2026)' },
  'Bangladesh':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bangladesh — immigrant visa processing paused (Jan 2026)' },
  'Barbados':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Barbados — immigrant visa processing paused (Jan 2026)' },
  'Belarus':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Belarus — immigrant visa processing paused (Jan 2026)' },
  'Belize':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Belize — immigrant visa processing paused (Jan 2026)' },
  'Bhutan':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bhutan — immigrant visa processing paused (Jan 2026)' },
  'Bosnia':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bosnia and Herzegovina — immigrant visa processing paused (Jan 2026)' },
  'Brazil':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Brazil — immigrant visa processing paused (Jan 2026)' },
  'Cambodia':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Cambodia — immigrant visa processing paused (Jan 2026)' },
  'Cameroon':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Cameroon — immigrant visa processing paused (Jan 2026)' },
  'Cape Verde':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Cape Verde — immigrant visa processing paused (Jan 2026)' },
  'Colombia':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Colombia — immigrant visa processing paused (Jan 2026)' },
  'DR Congo':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'DR Congo — immigrant visa processing paused (Jan 2026)' },
  'Egypt':              { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Egypt — immigrant visa processing paused (Jan 2026)' },
  'Ethiopia':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Ethiopia — immigrant visa processing paused (Jan 2026)' },
  'Fiji':               { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Fiji — immigrant visa processing paused (Jan 2026)' },
  'Georgia':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Georgia — immigrant visa processing paused (Jan 2026)' },
  'Ghana':              { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Ghana — immigrant visa processing paused (Jan 2026)' },
  'Grenada':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Grenada — immigrant visa processing paused (Jan 2026)' },
  'Guatemala':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Guatemala — immigrant visa processing paused (Jan 2026)' },
  'Guinea':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Guinea — immigrant visa processing paused (Jan 2026)' },
  'Iraq':               { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Iraq — immigrant visa processing paused (Jan 2026)' },
  'Jamaica':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Jamaica — immigrant visa processing paused (Jan 2026)' },
  'Jordan':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Jordan — immigrant visa processing paused (Jan 2026)' },
  'Kazakhstan':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kazakhstan — immigrant visa processing paused (Jan 2026)' },
  'Kosovo':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kosovo — immigrant visa processing paused (Jan 2026)' },
  'Kuwait':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kuwait — immigrant visa processing paused (Jan 2026)' },
  'Kyrgyzstan':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kyrgyzstan — immigrant visa processing paused (Jan 2026)' },
  'Lebanon':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Lebanon — immigrant visa processing paused (Jan 2026)' },
  'Liberia':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Liberia — immigrant visa processing paused (Jan 2026)' },
  'Moldova':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Moldova — immigrant visa processing paused (Jan 2026)' },
  'Mongolia':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Mongolia — immigrant visa processing paused (Jan 2026)' },
  'Montenegro':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Montenegro — immigrant visa processing paused (Jan 2026)' },
  'Morocco':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Morocco — immigrant visa processing paused (Jan 2026)' },
  'Nepal':              { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Nepal — immigrant visa processing paused (Jan 2026)' },
  'Nicaragua':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Nicaragua — immigrant visa processing paused (Jan 2026)' },
  'North Macedonia':    { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'North Macedonia — immigrant visa processing paused (Jan 2026)' },
  'Pakistan':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Pakistan — immigrant visa processing paused (Jan 2026)' },
  'Russia':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Russia — immigrant visa processing paused (Jan 2026)' },
  'Rwanda':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Rwanda — immigrant visa processing paused (Jan 2026)' },
  'Thailand':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Thailand — immigrant visa processing paused (Jan 2026)' },
  'Tunisia':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Tunisia — immigrant visa processing paused (Jan 2026)' },
  'Uganda':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Uganda — immigrant visa processing paused (Jan 2026)' },
  'Uruguay':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Uruguay — immigrant visa processing paused (Jan 2026)' },
  'Uzbekistan':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Uzbekistan — immigrant visa processing paused (Jan 2026)' },

  // ── EB Priority Date Backlog ───────────────────────────────────────────────
  'India':              { tier: 'backlog', minMonths: 36, maxMonths: 84,  label: 'India — severe EB priority date backlog (3–7+ years)' },
  'China':              { tier: 'backlog', minMonths: 24, maxMonths: 60,  label: 'China — significant EB backlog (2–5+ years)' },
  'Mexico':             { tier: 'backlog', minMonths: 12, maxMonths: 36,  label: 'Mexico — EB backlog in several categories (1–3 years)' },
  'Philippines':        { tier: 'backlog', minMonths: 12, maxMonths: 30,  label: 'Philippines — EB backlog in several categories (1–2.5 years)' },

  // ── Consulate Operational ─────────────────────────────────────────────────
  'Argentina':          { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Argentina — consulate operational' },
  'Australia':          { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Australia — consulate operational' },
  'Austria':            { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Austria — consulate operational' },
  'Belgium':            { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Belgium — consulate operational' },
  'Bolivia':            { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Bolivia — consulate operational' },
  'Bulgaria':           { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Bulgaria — consulate operational' },
  'Canada':             { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Canada — consulate operational' },
  'Chile':              { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Chile — consulate operational' },
  'Costa Rica':         { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Costa Rica — consulate operational' },
  'Croatia':            { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Croatia — consulate operational' },
  'Czech Republic':     { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Czech Republic — consulate operational' },
  'Denmark':            { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Denmark — consulate operational' },
  'Ecuador':            { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Ecuador — consulate operational' },
  'El Salvador':        { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'El Salvador — consulate operational' },
  'Finland':            { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Finland — consulate operational' },
  'France':             { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'France — consulate operational' },
  'Germany':            { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Germany — consulate operational' },
  'Greece':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Greece — consulate operational' },
  'Honduras':           { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Honduras — consulate operational' },
  'Hong Kong':          { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Hong Kong — consulate operational' },
  'Hungary':            { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Hungary — consulate operational' },
  'Iceland':            { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Iceland — consulate operational' },
  'Indonesia':          { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Indonesia — consulate operational' },
  'Ireland':            { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Ireland — consulate operational' },
  'Israel':             { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Israel — consulate operational' },
  'Italy':              { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Italy — consulate operational' },
  'Japan':              { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Japan — consulate operational' },
  'Kenya':              { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Kenya — consulate operational' },
  'Malaysia':           { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Malaysia — consulate operational' },
  'Netherlands':        { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Netherlands — consulate operational' },
  'New Zealand':        { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'New Zealand — consulate operational' },
  'Nigeria (open est.)':{ tier: 'open', minMonths: 12, maxMonths: 24, label: 'Nigeria — if IV pause lifts (estimated)' },
  'Norway':             { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Norway — consulate operational' },
  'Panama':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Panama — consulate operational' },
  'Paraguay':           { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Paraguay — consulate operational' },
  'Peru':               { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Peru — consulate operational' },
  'Poland':             { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Poland — consulate operational' },
  'Portugal':           { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Portugal — consulate operational' },
  'Romania':            { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Romania — consulate operational' },
  'Saudi Arabia':       { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Saudi Arabia — consulate operational' },
  'Serbia':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Serbia — consulate operational' },
  'Singapore':          { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Singapore — consulate operational' },
  'Slovakia':           { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Slovakia — consulate operational' },
  'South Africa':       { tier: 'open', minMonths: 10, maxMonths: 20, label: 'South Africa — consulate operational' },
  'South Korea':        { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'South Korea — consulate operational' },
  'Spain':              { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Spain — consulate operational' },
  'Sri Lanka':          { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Sri Lanka — consulate operational' },
  'Sweden':             { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Sweden — consulate operational' },
  'Switzerland':        { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Switzerland — consulate operational' },
  'Taiwan':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Taiwan — consulate operational' },
  'Turkey':             { tier: 'open', minMonths: 10, maxMonths: 18, label: 'Turkey — consulate operational' },
  'Ukraine':            { tier: 'open', minMonths: 12, maxMonths: 24, label: 'Ukraine — consulate operational (limited capacity)' },
  'United Arab Emirates':{ tier: 'open', minMonths: 10, maxMonths: 20, label: 'UAE — consulate operational' },
  'United Kingdom':     { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'United Kingdom — consulate operational' },
  'Vietnam':            { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Vietnam — consulate operational' },
  'Other (open)':       { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Other country — consulate operational (9–18 month estimate)' },
}

const CATEGORIES = [
  { value: 'eb1a',     label: 'EB-1A (Extraordinary Ability)',        mult: 0.8 },
  { value: 'eb2_niw',  label: 'EB-2 NIW (National Interest Waiver)',  mult: 1.0 },
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
  const isRestricted = countryEntry?.tier === 'ban' || countryEntry?.tier === 'blocked'

  const minMonths = countryEntry && categoryData
    ? Math.round(countryEntry.minMonths * categoryData.mult)
    : 0
  const maxMonths = countryEntry && categoryData
    ? Math.round(countryEntry.maxMonths * categoryData.mult)
    : 0

  const annualSalary = salaryNum

  // Income loss
  const incomeLossLow  = annualSalary * (minMonths / 12) * 0.35
  const incomeLossHigh = annualSalary * (maxMonths / 12) * 1.0

  // Career disruption
  const careerLow  = annualSalary * 0.08
  const careerHigh = annualSalary * 0.20

  // Relocation + housing
  const relocLow  = 15_000
  const relocHigh = 45_000

  // Healthcare gap
  const healthLow  = 6_000
  const healthHigh = Math.round((maxMonths / 12) * 18_000)

  // Spousal disruption
  const spouseLow  = 0
  const spouseHigh = 30_000

  const totalLow  = incomeLossLow  + careerLow  + relocLow  + healthLow  + spouseLow
  const totalHigh = incomeLossHigh + careerHigh + relocHigh + healthHigh + spouseHigh

  const premiumProcessing = 2_805
  const reportCost = 497
  const totalInvestment = premiumProcessing + reportCost

  const roiLow  = totalInvestment > 0 ? Math.round(totalLow  / totalInvestment) : 0
  const roiHigh = totalInvestment > 0 ? Math.round(totalHigh / totalInvestment) : 0

  const canCompute = salaryNum > 0 && country && category

  const tierOrder: Tier[] = ['ban', 'blocked', 'backlog', 'open']
  const tierLabels: Record<Tier, string> = {
    ban:     '── Full Travel Ban (PP 10998) ──',
    blocked: '── Immigrant Visa Pause (Jan 2026) ──',
    backlog: '── EB Priority Date Backlog ──',
    open:    '── Consulate Operational ──',
  }
  const groupedCountries = tierOrder.map(tier => ({
    tier,
    label: tierLabels[tier],
    entries: Object.entries(COUNTRY_DATA)
      .filter(([, v]) => v.tier === tier)
      .sort(([a], [b]) => a.localeCompare(b)),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-navy font-bold text-lg">F-1 Careers</Link>
          <Link href="/stay-score" className="text-sm text-teal font-semibold hover:underline">← Risk Score</Link>
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
            Most people focus on whether they qualify. Few do the math on what leaving
            actually costs across income, career trajectory, relocation, and family disruption.
            This analysis shows you both ends of the range — including for countries where
            consular processing is currently suspended.
          </p>
        </div>

        <div className="card space-y-5">
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

          <div>
            <label className="label">Your country of nationality</label>
            <select className="input" value={country} onChange={e => { setCountry(e.target.value); setComputed(false) }}>
              <option value="">Select country</option>
              {groupedCountries.map(group => (
                <optgroup key={group.tier} label={group.label}>
                  {group.entries.map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {countryEntry?.tier === 'ban' && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm font-bold text-red-700">Full travel ban in effect — consular processing is suspended indefinitely.</p>
                <p className="text-xs text-red-600 leading-relaxed">
                  The analysis below uses a planning estimate of {minMonths}–{maxMonths} months. In reality, nationals of your country have no defined timeline for when consular processing might resume. Adjustment of status inside the US is your only viable path to permanent residence.
                </p>
              </div>
            )}
            {countryEntry?.tier === 'blocked' && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm font-bold text-amber-800">Immigrant visa processing paused — no defined resumption date.</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  The analysis uses a planning estimate of {minMonths}–{maxMonths} months. Actual exposure depends entirely on when the pause lifts — which is not publicly scheduled.
                </p>
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

          <button onClick={() => setComputed(true)} disabled={!canCompute}
            className="w-full btn-teal py-4 text-base font-bold disabled:opacity-40">
            Calculate my financial exposure →
          </button>
          <p className="text-xs text-center text-mid">Estimates shown as a range — outcomes depend on your employer, family situation, and policy timeline</p>
        </div>

        {computed && canCompute && countryEntry && (
          <div className="space-y-4">

            <div className={`card border-2 text-center space-y-2 py-6 ${
              isRestricted ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${isRestricted ? 'text-red-700' : 'text-amber-800'}`}>
                Estimated time outside the US
              </p>
              <p className="text-4xl font-black text-navy">{minMonths}–{maxMonths} months</p>
              <p className="text-sm text-mid max-w-sm mx-auto leading-relaxed">
                {countryEntry.tier === 'ban'
                  ? 'Planning estimate only — full travel ban countries have no guaranteed processing timeline'
                  : countryEntry.tier === 'blocked'
                  ? 'Planning estimate — immigrant visa pause has no published resumption date'
                  : countryEntry.tier === 'backlog'
                  ? 'Priority date backlog estimate — actual wait may be significantly longer'
                  : `Typical consular processing timeline for this category and nationality`}
              </p>
            </div>

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
                ? 'Conservative: employer allows partial remote work, shorter timeline, minimal family disruption'
                : 'Worst-case: full job loss, maximum timeline, complete family relocation, no remote work'}
            </p>

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
              {isRestricted && (
                <p className="text-xs text-red-300 pt-1">
                  Note: if processing remains suspended beyond the estimated timeline, this figure compounds accordingly
                </p>
              )}
            </div>

            <div className="card space-y-3">
              <p className="text-xs font-bold text-navy uppercase tracking-widest mb-1">
                Cost breakdown ({scenario === 'typical' ? 'conservative' : 'worst-case'})
              </p>
              {[
                {
                  label: scenario === 'typical'
                    ? `Income impact — ${minMonths} months, 35% reduction (partial remote work)`
                    : `Income impact — ${maxMonths} months, full loss (employer cannot accommodate remote)`,
                  value: scenario === 'typical' ? incomeLossLow : incomeLossHigh,
                  note: 'The single biggest variable. Whether your employer allows remote work during processing determines most of this figure.',
                },
                {
                  label: 'Career disruption — promotions, equity, seniority, network',
                  value: scenario === 'typical' ? careerLow : careerHigh,
                  note: scenario === 'typical'
                    ? '8% of annual comp — one performance cycle affected, project continuity maintained'
                    : '20% of annual comp — promotion cycle missed, team restructured around your absence, equity unvested',
                },
                {
                  label: 'Relocation, housing differential, and setup costs',
                  value: scenario === 'typical' ? relocLow : relocHigh,
                  note: scenario === 'typical'
                    ? '$15,000 — solo trip, short-term accommodation, minimal logistics'
                    : '$45,000 — full family relocation, temporary housing, school transitions, storage',
                },
                {
                  label: 'US healthcare and insurance coverage gap',
                  value: scenario === 'typical' ? healthLow : healthHigh,
                  note: scenario === 'typical'
                    ? '$6,000 — approximately 6 months without US employer-sponsored coverage'
                    : `${fmt(healthHigh)} — full ${maxMonths}-month period at $18,000/year equivalent`,
                },
                {
                  label: 'Spousal income and career disruption',
                  value: scenario === 'typical' ? spouseLow : spouseHigh,
                  note: scenario === 'typical'
                    ? 'Conservative: spouse maintains US income and employment remotely'
                    : '$30,000 — spouse must also leave, reduce hours, or take career pause',
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

            <div className="card border-2 border-teal space-y-4">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">The alternative: fight to stay</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Cost of leaving (range)</p>
                  <p className="text-2xl font-black text-red-500">{fmtRange(totalLow, totalHigh)}</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-mid font-medium">Cost of building your AoS case</p>
                  <p className="text-3xl font-black text-teal">{fmt(totalInvestment)}</p>
                  <p className="text-[10px] text-mid">$2,805 premium processing + $497 evidence package</p>
                </div>
              </div>
              <div className="bg-teal/8 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-mid">Return on investment</p>
                <p className="text-4xl font-black text-navy">{roiLow}× – {roiHigh}×</p>
                <p className="text-sm text-mid">
                  Every dollar invested protects <strong className="text-navy">{roiLow}–{roiHigh} dollars</strong> of financial exposure
                </p>
              </div>
            </div>

            <div className="card space-y-3">
              <p className="text-sm font-bold text-navy">What an approved NIW I-140 actually provides</p>
              {[
                { pt: '45 business days', detail: 'I-140 decision with premium processing — approximately 9 weeks from filing' },
                { pt: 'Government certification', detail: 'A formal USCIS finding that your work is in the national interest — the highest-value document you can hold' },
                { pt: 'Extraordinary circumstances evidence', detail: 'The exact standard USCIS now requires under PM-602-0199 to approve adjustment of status inside the US' },
                { pt: 'Priority date locked', detail: 'Your place in line is fixed from the I-140 filing date — immune to future policy changes' },
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
              <p className="text-sm text-white/70 leading-relaxed">Your full NIW strategy report includes the Dhanasar analysis, draft petition language, and the exact evidence map USCIS needs to approve your adjustment of status.</p>
              <Link href="/login" className="inline-block bg-teal text-white font-bold px-8 py-3 rounded-xl hover:bg-teal/90 transition-colors">
                Get my evidence package — $497 →
              </Link>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-mid pb-4 space-y-1">
          <p>Estimates are illustrative ranges, not guarantees. Individual outcomes vary significantly. Not legal or financial advice.</p>
          <p>Country data reflects PP 10998 (Jan 1, 2026), State Dept immigrant visa pause (Jan 21, 2026), and current EB visa bulletin priority dates.</p>
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
