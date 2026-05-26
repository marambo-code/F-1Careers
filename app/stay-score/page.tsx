'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── AUTHORITATIVE COUNTRY RISK TIERS ──────────────────────────────────────
// Sources:
//   • PP 10998 (Proclamation, Dec 16 2025, effective Jan 1 2026) — travel ban
//   • State Dept Immigrant Visa Pause, effective Jan 21 2026 — 75 countries
//
// Tier 0: PP 10998 FULL suspension — all immigrant AND nonimmigrant visas suspended
// Tier 1: PP 10998 PARTIAL suspension AND on 75-country immigrant visa pause
// Tier 2: PP 10998 PARTIAL suspension only (not on immigrant visa pause)
// Tier 3: On 75-country immigrant visa pause only (no travel ban)
// Tier 4: EB priority date backlog — no ban, but severe multi-year waits
// Tier 5: Open — no current restrictions
const COUNTRY_TIER: Record<string, 0 | 1 | 2 | 3 | 4 | 5> = {
  // ── Tier 0: PP 10998 Full Suspension ───────────────────────────────────
  'Afghanistan': 0, 'Burma': 0, 'Myanmar': 0, 'Burkina Faso': 0, 'Chad': 0,
  'Republic of Congo': 0, 'Equatorial Guinea': 0, 'Eritrea': 0, 'Haiti': 0,
  'Iran': 0, 'Laos': 0, 'Libya': 0, 'Mali': 0, 'Niger': 0,
  'Sierra Leone': 0, 'Somalia': 0, 'South Sudan': 0, 'Sudan': 0,
  'Syria': 0, 'Yemen': 0,

  // ── Tier 1: Partial Travel Ban + Immigrant Visa Pause ──────────────────
  'Antigua and Barbuda': 1, "Ivory Coast": 1, "Côte d'Ivoire": 1, 'Cuba': 1,
  'Dominica': 1, 'Gambia': 1, 'Nigeria': 1, 'Senegal': 1,
  'Tanzania': 1, 'Togo': 1, 'Venezuela': 1,

  // ── Tier 2: Partial Travel Ban (not on 75-country pause) ───────────────
  'Angola': 2, 'Benin': 2, 'Burundi': 2, 'Gabon': 2, 'Malawi': 2,
  'Mauritania': 2, 'Tonga': 2, 'Turkmenistan': 2, 'Zambia': 2, 'Zimbabwe': 2,

  // ── Tier 3: 75-Country Immigrant Visa Pause Only ───────────────────────
  'Albania': 3, 'Algeria': 3, 'Armenia': 3, 'Azerbaijan': 3, 'Bahamas': 3,
  'Bangladesh': 3, 'Barbados': 3, 'Belarus': 3, 'Belize': 3, 'Bhutan': 3,
  'Bosnia and Herzegovina': 3, 'Brazil': 3, 'Cambodia': 3, 'Cameroon': 3,
  'Cabo Verde': 3, 'Cape Verde': 3, 'Colombia': 3, 'Democratic Republic of Congo': 3,
  'Egypt': 3, 'Ethiopia': 3, 'Fiji': 3, 'Georgia': 3, 'Ghana': 3,
  'Grenada': 3, 'Guatemala': 3, 'Guinea': 3, 'Iraq': 3, 'Jamaica': 3,
  'Jordan': 3, 'Kazakhstan': 3, 'Kosovo': 3, 'Kuwait': 3, 'Kyrgyzstan': 3,
  'Lebanon': 3, 'Liberia': 3, 'Moldova': 3, 'Mongolia': 3, 'Montenegro': 3,
  'Morocco': 3, 'Nepal': 3, 'Nicaragua': 3, 'North Macedonia': 3, 'Pakistan': 3,
  'Russia': 3, 'Rwanda': 3, 'Saint Kitts and Nevis': 3, 'Saint Lucia': 3,
  'Saint Vincent and the Grenadines': 3, 'Thailand': 3, 'Tunisia': 3,
  'Uganda': 3, 'Uruguay': 3, 'Uzbekistan': 3,

  // ── Tier 4: EB Priority Date Backlog ───────────────────────────────────
  'China': 4, 'India': 4, 'Mexico': 4, 'Philippines': 4,
}

function getCountryTier(country: string): 0 | 1 | 2 | 3 | 4 | 5 {
  return COUNTRY_TIER[country] ?? 5
}

// ─── Country dropdown — comprehensive alphabetical list ─────────────────────
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
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
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
  'Republic of Congo', 'Romania', 'Russia', 'Rwanda',
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

// ─── Fields ────────────────────────────────────────────────────────────────
const FIELDS = [
  { value: 'stem_cs',   label: 'AI / Computer Science / Software Engineering' },
  { value: 'stem_bio',  label: 'Biotech / Biology / Life Sciences' },
  { value: 'medicine',  label: 'Medicine / Clinical Healthcare / Public Health' },
  { value: 'stem_phys', label: 'Physics / Chemistry / Materials Science' },
  { value: 'stem_eng',  label: 'Engineering (electrical, mechanical, civil, etc.)' },
  { value: 'data',      label: 'Data Science / Statistics / Quantitative Research' },
  { value: 'education', label: 'Education / Social Sciences / Policy' },
  { value: 'business',  label: 'Business / Finance / Economics' },
  { value: 'law',       label: 'Law / Government / Public Policy' },
  { value: 'arts',      label: 'Arts / Design / Architecture / Media' },
  { value: 'sports',    label: 'Athletics / Sports' },
  { value: 'other',     label: 'Other — specify below' },
]

// ─── Evidence Criteria (10 USCIS-aligned criteria) ──────────────────────────
const CONTRIBUTION_CRITERIA = [
  { id: 'publications',   label: 'Published original research, papers, books, or articles in peer-reviewed or professional venues', sub: 'Journals, academic conferences, industry publications' },
  { id: 'citations',      label: 'Work cited, referenced, or built upon by other researchers, professionals, or institutions', sub: 'Google Scholar, Semantic Scholar, referenced in industry literature' },
  { id: 'patents',        label: 'Patents filed or granted, or original IP licensed or adopted by others', sub: 'US or international utility/design patents, technology licensing agreements' },
  { id: 'peer_review',    label: 'Invited to peer-review, evaluate grant applications, or serve on editorial or scientific boards', sub: 'Journal reviewer, conference program committee, NIH/NSF reviewer, editorial board' },
  { id: 'invited_speaker',label: 'Invited speaker at conferences, institutions, or professional panels', sub: 'Named or invited — not just an accepted abstract; includes keynotes and guest lectures' },
  { id: 'awards',         label: 'Received competitive awards, prizes, fellowships, or grants for professional achievement', sub: 'External competitive recognition — not routine internal employee awards' },
  { id: 'media',          label: 'Featured in press, media, or professional publications specifically about your work', sub: 'Newspapers, magazines, industry outlets, podcasts — not self-published content' },
  { id: 'critical_role',  label: 'Critical, senior, or otherwise distinguished role at a nationally or internationally recognized organization', sub: 'Position of genuine authority, influence, or expertise within a recognized institution' },
  { id: 'high_salary',    label: 'Compensation demonstrably above the median for your occupation, experience, and region', sub: 'Documented via offer letters or compensation data — typically top 15% for your field' },
  { id: 'leadership',     label: 'Founded an organization, led significant teams, or mentored professionals who achieved recognition', sub: 'Founder roles, large-team management, or documented mentorship of notable individuals' },
]

// ─── Exposure Scoring Engine ────────────────────────────────────────────────
// HIGHER score = MORE exposed = WORSE. Scale: 0 (fully protected) → 100 (critical risk)
interface Inputs {
  visa: string; visaOther: string
  field: string; fieldOther: string
  education: string; years: string
  country: string; countryOther: string
  contributions: string[]
  sevisTerminated: string   // 'yes' | 'no' | ''
  programYears: string      // '1-2' | '3-4' | '5+' | 'na' | ''
  // PM-602-0199 explicit discretionary factors
  i140Approved: string      // 'yes' | 'no' | ''
  priorViolations: string   // 'yes' | 'no' | ''
  usFamily: string          // 'yes' | 'no' | ''
  socialMediaRisk: string   // 'yes' | 'no' | ''
}

function computeExposure(inputs: Inputs) {
  const effectiveCountry = inputs.country === 'Other' ? (inputs.countryOther || 'Unknown') : inputs.country
  const tier = getCountryTier(effectiveCountry)
  const selectedCount = inputs.contributions.length

  // 1. Country Risk Exposure (0–35 pts, higher = more exposed)
  const countryExp: Record<number, number> = { 0: 35, 1: 30, 2: 26, 3: 20, 4: 12, 5: 4 }
  const countryPoints = countryExp[tier]
  const countryNote = tier === 0
    ? `${effectiveCountry} is subject to a full suspension of immigrant AND non-immigrant visa issuance under Proclamation 10998. Consular processing is not an available path. Adjustment of status inside the US is your only option — building an extraordinary circumstances case is existential, not optional.`
    : tier === 1
    ? `${effectiveCountry} is subject to both a partial travel ban (Proclamation 10998) and the 75-country immigrant visa pause. Consular processing is effectively blocked. AoS inside the US is your primary viable path.`
    : tier === 2
    ? `${effectiveCountry} is under a partial travel ban affecting immigrant visas and key nonimmigrant categories (B, F, M, J). Consular processing for a green card is severely restricted. Filing for AoS now is the prudent course.`
    : tier === 3
    ? `${effectiveCountry} is on the State Department's 75-country immigrant visa pause (effective Jan 21, 2026). Green card consular processing is currently suspended. AoS inside the US is your only active path.`
    : tier === 4
    ? `${effectiveCountry} nationals face severe EB priority date backlogs — current wait times can reach 3–10+ years for consular processing. Filing a strong AoS case now substantially reduces the exposure window.`
    : `Your consulate is currently operational. Consular processing remains an option, though AoS inside the US still provides stronger protection against future policy shifts.`

  // 2. Visa Status Exposure (0–25 pts)
  const visaExp: Record<string, number> = {
    'EB-2 NIW Pending': 2, 'O-1': 5, 'H-1B': 10, 'L-1': 10, 'H-1B1': 13,
    'F-1 Student': 16, 'J-1': 20,
    'F-1 OPT STEM': 17, 'F-1 OPT': 21, 'F-1 CPT': 25, 'Other': 16,
  }
  const visaPoints = visaExp[inputs.visa] ?? 16
  const visaNote = inputs.visa === 'EB-2 NIW Pending'
    ? 'An approved NIW I-140 is the single strongest evidence of national interest — your AoS position is substantially protected.'
    : inputs.visa === 'O-1'
    ? 'O-1 holders have cleared an extraordinary ability standard already — strong favorable factor in discretionary AoS review.'
    : ['H-1B', 'L-1'].includes(inputs.visa)
    ? 'Dual-intent visa — generally viewed favorably in discretionary review, but does not independently guarantee AoS approval.'
    : inputs.visa === 'F-1 Student'
    ? 'As a current F-1 student, the proposed D/S 4-year cap is directly relevant to your situation. Building your evidence record now — before you reach OPT — puts you significantly ahead when it matters most.'
    : inputs.visa === 'J-1'
    ? 'J-1 holders subject to the 212(e) two-year home residency requirement face an additional barrier — you cannot adjust status or obtain an immigrant visa until the requirement is fulfilled or waived. Confirm whether your J-1 carries a 212(e) requirement; if so, a waiver is a prerequisite to any green card path.'
    : inputs.visa === 'F-1 OPT STEM'
    ? 'STEM OPT provides a work authorization runway but limited protection. An I-140 filing is your most important next move.'
    : ['F-1 OPT', 'F-1 CPT'].includes(inputs.visa)
    ? 'F-1 status provides the least discretionary insulation. Filing NIW with premium processing should be your top priority.'
    : 'Your status situation requires personalized analysis — the full strategy report will map your specific options.'

  // 3. Evidence Gap Exposure (0–20 pts, fewer credentials = more exposed)
  const evidencePoints = selectedCount >= 6 ? 2 : selectedCount >= 4 ? 6 : selectedCount >= 2 ? 11 : selectedCount === 1 ? 15 : 20
  const evidenceNote = selectedCount >= 6
    ? `${selectedCount} documented criteria — strong evidentiary record. The full report converts this into a structured petition framework.`
    : selectedCount >= 4
    ? `${selectedCount} documented criteria — solid foundation. Your report will identify 2–3 additional criteria you can build within 60–90 days.`
    : selectedCount >= 2
    ? `${selectedCount} documented criteria — some foundation, but gaps that need closing. Your report will prioritize the highest-leverage moves.`
    : selectedCount === 1
    ? 'Minimal documented evidence at this stage. This is your most urgent gap to close — the strategy report will give you a concrete 90-day plan.'
    : 'No documented extraordinary evidence yet. This is critical to address — your full report will show you the fastest evidence-building path.'

  // 4. Career Tenure (0–10 pts, less experience = more exposed)
  const yearsExp: Record<string, number> = { '1': 10, '3': 7, '6': 5, '11': 3, '16': 1 }
  const yearsPoints = yearsExp[inputs.years] ?? 10
  const yearsNote = inputs.years === '16'
    ? 'Long-standing US career creates strong equitable considerations in discretionary AoS review.'
    : inputs.years === '11'
    ? 'Established professional track record supports lawful US presence argument.'
    : inputs.years === '6'
    ? 'Meaningful career tenure — solid foundation for the career impact argument.'
    : 'Earlier-career candidates should emphasize outsized impact and trajectory over years of tenure.'

  // 5. Education (0–10 pts, lower degree = more exposed)
  const eduExp: Record<string, number> = { 'phd': 2, 'md': 2, 'masters': 4, 'bachelors': 7, 'other': 9 }
  const eduPoints = eduExp[inputs.education] ?? 7
  const eduNote = ['phd', 'md'].includes(inputs.education)
    ? 'Terminal degree is a primary positive factor in discretionary AoS analysis and satisfies the NIW advanced degree prong directly.'
    : inputs.education === 'masters'
    ? "Advanced degree satisfies the NIW Dhanasar advanced degree analysis — solid foundation."
    : "Additional evidence of outsized professional impact is essential to compensate at the bachelor's level."

  // 6. Approved I-140 — major mitigating factor (-18 pts)
  // An approved I-140 is the definitive "extraordinary circumstances" evidence under PM-602-0199
  const i140Points = inputs.i140Approved === 'yes' ? -18 : 0
  const i140Note = inputs.i140Approved === 'yes'
    ? 'An approved I-140 is the single strongest evidence of national interest you can hold. Under PM-602-0199, this directly satisfies the extraordinary circumstances standard — it is documented USCIS recognition that your presence serves national interest.'
    : 'No approved I-140 on record. Filing NIW with premium processing is the highest-leverage move available to you — an approved I-140 is definitive extraordinary circumstances documentation.'

  // 7. Prior Immigration Violations — PM-602-0199 §(a)(i): explicitly "highly relevant" adverse factor (+15 pts)
  const violationsPoints = inputs.priorViolations === 'yes' ? 15 : 0
  const violationsNote = inputs.priorViolations === 'yes'
    ? 'Prior violations (overstay, unauthorized employment, status breach) are explicitly listed in PM-602-0199 as highly relevant adverse factors in the totality-of-circumstances discretionary analysis. This is your most urgent issue to address with immigration counsel.'
    : 'No prior violations — a significant positive factor. USCIS officers are directed to weigh consistent status compliance favorably in discretionary review.'

  // 8. US Citizen or LPR Immediate Family — PM-602-0199 §(b): explicit positive equitable factor (-8 pts)
  const usFamilyPoints = inputs.usFamily === 'yes' ? -8 : 0
  const usFamilyNote = inputs.usFamily === 'yes'
    ? 'US citizen or LPR immediate family ties are explicitly listed in PM-602-0199 as a positive equitable factor. Officers are required to weigh this in the totality-of-circumstances analysis — it meaningfully strengthens your discretionary position.'
    : 'No immediate US citizen or LPR family ties. While not required, family ties are an explicit positive factor under PM-602-0199 — other equities (career impact, community) become more important to document.'

  // 9. Social Media Risk — flagged by USCIS/State Dept; PM-602-0199 moral character factor (+10 pts)
  // Immigration attorneys now explicitly advise clients to review public social media before filing
  const socialMediaPoints = inputs.socialMediaRisk === 'yes' ? 10 : 0
  const socialMediaNote = inputs.socialMediaRisk === 'yes'
    ? 'USCIS and State Dept now routinely screen public social media. Immigration attorneys advise that posts criticizing US immigration enforcement, expressing political affiliations, or discussing visa strategy can be flagged under PM-602-0199\'s moral character and conduct factors. Review and archive public accounts before filing.'
    : 'No flagged social media content — neutral factor. Note that USCIS screens public accounts; immigration attorneys recommend auditing your social media presence before any AoS filing.'

  // 6. SEVIS Termination History (0–15 pts)
  const sevisPoints = inputs.sevisTerminated === 'yes' ? 15 : 0
  const sevisNote = inputs.sevisTerminated === 'yes'
    ? 'A prior SEVIS termination — even if reversed — is a significant adverse factor in discretionary AoS review. Officers conduct totality-of-circumstances analysis and a termination on record materially raises your exposure. Proactive extraordinary circumstances documentation is essential.'
    : 'No SEVIS termination on record — neutral factor in discretionary review.'

  // 7. Duration of Status / Program Length (0–10 pts) — only relevant for F-1
  const isF1 = ['F-1 Student', 'F-1 OPT STEM', 'F-1 OPT', 'F-1 CPT', 'J-1'].includes(inputs.visa) || (inputs.visa === 'Other' && (inputs.visaOther.toLowerCase().includes('f-1') || inputs.visaOther.toLowerCase().includes('j-1')))
  const dsPoints = isF1
    ? (inputs.programYears === '5+' ? 10 : inputs.programYears === '3-4' ? 6 : 0)
    : 0
  const dsNote = !isF1
    ? 'Duration of Status changes apply to F-1 visa holders. Not applicable to your current status.'
    : inputs.programYears === '5+'
    ? 'Your program exceeds the proposed 4-year D/S cap. Under the DHS final rule (expected September 2026), you will need to file an I-539 extension. This is an active deadline — OPT/STEM OPT applications must be filed within 30 days of program end under the new rule.'
    : inputs.programYears === '3-4'
    ? 'Your program approaches the 4-year D/S cap. Monitor the DHS final rule timeline closely — if enacted September 2026, PhD students in year 3+ will need I-539 extensions.'
    : 'Your program falls within the proposed 4-year D/S limit. Lower exposure from the D/S rule change.'

  const raw = countryPoints + visaPoints + evidencePoints + yearsPoints + eduPoints
    + sevisPoints + dsPoints + i140Points + violationsPoints + usFamilyPoints + socialMediaPoints
  const total = Math.min(100, Math.max(0, raw))

  return {
    score: total,
    breakdown: [
      { label: 'Country & Consular Risk', points: countryPoints, max: 35, note: countryNote, tier },
      { label: 'Visa Status Exposure', points: visaPoints, max: 25, note: visaNote },
      { label: 'Evidence Gap', points: evidencePoints, max: 20, note: evidenceNote },
      { label: 'Career Tenure', points: yearsPoints, max: 10, note: yearsNote },
      { label: 'Education Level', points: eduPoints, max: 10, note: eduNote },
      ...(inputs.sevisTerminated === 'yes' ? [{ label: 'SEVIS Termination History', points: sevisPoints, max: 15, note: sevisNote }] : []),
      ...(isF1 && inputs.programYears && inputs.programYears !== 'na' ? [{ label: 'Duration of Status Risk', points: dsPoints, max: 10, note: dsNote }] : []),
      { label: 'Approved I-140 (Mitigating)', points: i140Points, max: 0, note: i140Note },
      ...(inputs.priorViolations === 'yes' ? [{ label: 'Prior Immigration Violations', points: violationsPoints, max: 15, note: violationsNote }] : []),
      { label: 'US Family Ties (Equitable)', points: usFamilyPoints, max: 0, note: usFamilyNote },
      ...(inputs.socialMediaRisk === 'yes' ? [{ label: 'Social Media Exposure', points: socialMediaPoints, max: 10, note: socialMediaNote }] : []),
    ],
  }
}

function getScoreLabel(score: number) {
  if (score >= 70) return {
    label: 'Critical Exposure',
    sub: 'Immediate action required',
    color: 'text-red-600', ring: '#DC2626',
    bg: 'bg-red-50 border-red-200',
    advice: 'Your profile has critical vulnerability. Without an approved I-140, consular processing or indefinite US departure is a near-term realistic scenario for your situation. The strategy report will map your most urgent options — some can be activated within weeks.',
  }
  if (score >= 50) return {
    label: 'High Exposure',
    sub: 'Urgent action needed',
    color: 'text-orange-600', ring: '#EA580C',
    bg: 'bg-orange-50 border-orange-200',
    advice: 'Material exposure to consular processing requirements. Your full report will identify the fastest evidence-building path — several gaps are realistically closeable within 60–90 days.',
  }
  if (score >= 25) return {
    label: 'Moderate Exposure',
    sub: 'Proactive steps recommended',
    color: 'text-yellow-700', ring: '#B45309',
    bg: 'bg-yellow-50 border-yellow-200',
    advice: 'You have a credible position but identifiable gaps. The strategy report will specify which evidence builds the strongest extraordinary circumstances argument for your specific profile.',
  }
  return {
    label: 'Low Exposure',
    sub: 'Strong current position',
    color: 'text-teal-600', ring: '#00C2A8',
    bg: 'bg-teal-50 border-teal-200',
    advice: 'Your profile demonstrates solid grounds for extraordinary circumstances protection. Filing your NIW I-140 with premium processing now locks in that protection — an approved I-140 is definitive evidence of national interest.',
  }
}

// ─── Component ────────────────────────────────────────────────────────────
export default function RiskScorePage() {
  const [step, setStep] = useState(0)
  const [inputs, setInputs] = useState<Inputs>({
    visa: '', visaOther: '', field: '', fieldOther: '',
    education: '', years: '', country: '', countryOther: '', contributions: [],
    sevisTerminated: '', programYears: '',
    i140Approved: '', priorViolations: '', usFamily: '', socialMediaRisk: '',
  })
  const [result, setResult] = useState<ReturnType<typeof computeExposure> | null>(null)
  const [copied, setCopied] = useState(false)

  const set = (k: keyof Inputs, v: string | string[]) => setInputs(i => ({ ...i, [k]: v }))
  const toggleContrib = (id: string) => setInputs(i => ({
    ...i,
    contributions: i.contributions.includes(id)
      ? i.contributions.filter(c => c !== id)
      : [...i.contributions, id],
  }))

  const effectiveCountry = inputs.country === 'Other' ? inputs.countryOther : inputs.country
  const countryTier = effectiveCountry ? getCountryTier(effectiveCountry) : null

  const isF1Status = ['F-1 Student', 'F-1 OPT STEM', 'F-1 OPT', 'F-1 CPT', 'J-1'].includes(inputs.visa) || (inputs.visa === 'Other' && (inputs.visaOther.toLowerCase().includes('f-1') || inputs.visaOther.toLowerCase().includes('j-1')))

  const canSubmit = inputs.visa &&
    (inputs.visa !== 'Other' || inputs.visaOther.trim()) &&
    inputs.field &&
    (inputs.field !== 'other' || inputs.fieldOther.trim()) &&
    inputs.education && inputs.years && inputs.country &&
    (inputs.country !== 'Other' || inputs.countryOther.trim()) &&
    inputs.sevisTerminated &&
    (!isF1Status || inputs.programYears) &&
    inputs.i140Approved && inputs.priorViolations && inputs.usFamily && inputs.socialMediaRisk

  const handleCompute = () => { setResult(computeExposure(inputs)); setStep(1) }

  const handleCopy = () => {
    const text = `This is how I stay on top of my immigration status in 2026. Policy is moving fast — every F-1, OPT, and H-1B professional should know where they stand.\n\n→ f1careers.app/stay-score`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
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
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            USCIS PM-602-0199 in effect — May 21, 2026
          </div>
          <h1 className="text-3xl font-black text-navy leading-tight">
            Immigration Risk Score
          </h1>
          <div className="inline-flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-2 text-xs text-mid">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal inline-block" /> Lower score = stronger protection</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Higher score = more at risk</span>
          </div>
          <p className="text-mid text-sm max-w-md mx-auto leading-relaxed">
            Adjustment of status is now officially discretionary. Duration of Status is ending. SEVIS terminations are being enforced.
            This tool scores your exposure across all active risk factors — in under 2 minutes.
          </p>
        </div>

        {step === 0 && (
          <div className="card space-y-7">

            {/* Visa */}
            <div>
              <label className="label">Current visa / immigration status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['F-1 Student', 'J-1', 'F-1 CPT', 'F-1 OPT', 'F-1 OPT STEM', 'H-1B', 'H-1B1', 'L-1', 'O-1', 'EB-2 NIW Pending', 'Other'].map(v => (
                  <button key={v} onClick={() => set('visa', v)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${inputs.visa === v ? 'bg-navy text-white border-navy' : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'}`}>
                    {v}
                  </button>
                ))}
              </div>
              {inputs.visa === 'Other' && (
                <input className="input mt-2" placeholder="Describe your current immigration status"
                  value={inputs.visaOther} onChange={e => set('visaOther', e.target.value)} />
              )}
            </div>

            {/* Field */}
            <div>
              <label className="label">Primary field of work</label>
              <select className="input" value={inputs.field} onChange={e => set('field', e.target.value)}>
                <option value="">Select your field</option>
                {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              {inputs.field === 'other' && (
                <input className="input mt-2" placeholder="Your field or profession"
                  value={inputs.fieldOther} onChange={e => set('fieldOther', e.target.value)} />
              )}
            </div>

            {/* Education + Years */}
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

            {/* Country */}
            <div>
              <label className="label">Country of birth / nationality</label>
              <select className="input" value={inputs.country} onChange={e => set('country', e.target.value)}>
                <option value="">Select your country</option>
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {inputs.country === 'Other' && (
                <input className="input mt-2" placeholder="Enter your country"
                  value={inputs.countryOther} onChange={e => set('countryOther', e.target.value)} />
              )}
              {inputs.country && inputs.country !== 'Other' && countryTier !== null && countryTier <= 1 && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-red-700">
                    {countryTier === 0
                      ? 'Full visa suspension in effect — consular processing is not a viable path for nationals of your country.'
                      : 'Partial travel ban + immigrant visa pause in effect — consular processing is severely restricted for your country.'}
                  </p>
                </div>
              )}
              {inputs.country && inputs.country !== 'Other' && countryTier !== null && (countryTier === 2 || countryTier === 3) && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-amber-800">
                    {countryTier === 2
                      ? 'Partial travel ban applies — immigrant visas and key nonimmigrant categories restricted for your country.'
                      : 'Immigrant visa processing is currently paused for your country of nationality (State Dept pause, effective Jan 21, 2026).'}
                  </p>
                </div>
              )}
            </div>

            {/* SEVIS Termination */}
            <div>
              <label className="label">Has your SEVIS record ever been terminated or flagged?</label>
              <p className="text-xs text-mid mb-2 leading-relaxed">Include cases that were later reversed or reinstated — a prior termination remains a factor in discretionary review.</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'no', label: 'No — never terminated' },
                  { val: 'yes', label: 'Yes — terminated or flagged' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => set('sevisTerminated', opt.val)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${inputs.sevisTerminated === opt.val ? (opt.val === 'yes' ? 'bg-red-600 text-white border-red-600' : 'bg-navy text-white border-navy') : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration of Status — F-1 only */}
            {isF1Status && (
              <div>
                <label className="label">How long is your degree program?</label>
                <p className="text-xs text-mid mb-2 leading-relaxed">DHS is finalizing a rule replacing Duration of Status with a 4-year hard cap (expected September 2026). Students in programs longer than 4 years will need to file an I-539 extension.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '1-2', label: '1–2 years' },
                    { val: '3-4', label: '3–4 years' },
                    { val: '5+', label: '5+ years (PhD / long program)' },
                  ].map(opt => (
                    <button key={opt.val} onClick={() => set('programYears', opt.val)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${inputs.programYears === opt.val ? (opt.val === '5+' ? 'bg-orange-600 text-white border-orange-600' : 'bg-navy text-white border-navy') : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PM-602-0199 Discretionary Factors */}
            <div className="space-y-5 pt-2 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-teal mb-1">PM-602-0199 Discretionary Factors</p>
                <p className="text-xs text-mid leading-relaxed">These are the exact factors USCIS officers are now required to weigh in your adjustment of status review. Answer honestly — this is for your assessment only.</p>
              </div>

              {/* I-140 */}
              <div>
                <label className="label">Do you have an approved I-140 petition?</label>
                <p className="text-xs text-mid mb-2">An approved I-140 is the single most protective document you can hold under PM-602-0199 — it is USCIS's own documented recognition that your presence serves the national interest.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: 'yes', label: 'Yes — I-140 approved' }, { val: 'no', label: 'No — not yet' }].map(opt => (
                    <button key={opt.val} onClick={() => set('i140Approved', opt.val)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${inputs.i140Approved === opt.val ? (opt.val === 'yes' ? 'bg-teal text-white border-teal' : 'bg-navy text-white border-navy') : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prior violations — reframed as status consistency */}
              <div>
                <label className="label">Have you maintained continuous lawful immigration status throughout your time in the US?</label>
                <p className="text-xs text-mid mb-2">Consistent status maintenance is a primary positive factor in discretionary review. Any gaps — even brief ones — are relevant to how USCIS weighs your application under PM-602-0199.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: 'no', label: 'Yes — continuous lawful status' }, { val: 'yes', label: 'No — gaps or issues exist' }].map(opt => (
                    <button key={opt.val} onClick={() => set('priorViolations', opt.val)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${inputs.priorViolations === opt.val ? (opt.val === 'yes' ? 'bg-orange-500 text-white border-orange-500' : 'bg-navy text-white border-navy') : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* US family — reframed as equities */}
              <div>
                <label className="label">Do you have meaningful roots in the United States — family, long-term residence, or deep community ties?</label>
                <p className="text-xs text-mid mb-2">PM-602-0199 explicitly requires officers to weigh equitable factors including family ties, length of residence, and community contributions. These strengthen your discretionary position.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: 'yes', label: 'Yes — significant ties' }, { val: 'no', label: 'Limited ties so far' }].map(opt => (
                    <button key={opt.val} onClick={() => set('usFamily', opt.val)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${inputs.usFamily === opt.val ? (opt.val === 'yes' ? 'bg-teal text-white border-teal' : 'bg-navy text-white border-navy') : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social media — reframed as risk awareness */}
              <div>
                <label className="label">Have you reviewed your public social media presence with your immigration filing in mind?</label>
                <p className="text-xs text-mid mb-2">USCIS and State Dept now screen public social media as part of the application review process. Immigration attorneys recommend auditing accounts before any AoS filing — this is standard advice in 2026.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: 'no', label: 'Yes — reviewed and clean' }, { val: 'yes', label: 'Not yet reviewed' }].map(opt => (
                    <button key={opt.val} onClick={() => set('socialMediaRisk', opt.val)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${inputs.socialMediaRisk === opt.val ? (opt.val === 'yes' ? 'bg-navy text-white border-navy' : 'bg-teal text-white border-teal') : 'border-gray-200 text-mid hover:border-navy/40 hover:text-navy'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Evidence */}
            <div>
              <div className="mb-4">
                <label className="label mb-0.5">Professional evidence record</label>
                <p className="text-xs text-mid leading-relaxed">
                  Select every item that applies. These correspond to the specific evidentiary standards USCIS uses in extraordinary circumstances analysis.
                  This is a documentation inventory — be precise.
                </p>
              </div>
              <div className="space-y-2">
                {CONTRIBUTION_CRITERIA.map(c => {
                  const selected = inputs.contributions.includes(c.id)
                  return (
                    <button key={c.id} onClick={() => toggleContrib(c.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${selected ? 'bg-teal/5 border-teal text-navy' : 'border-gray-200 text-navy hover:border-gray-300 hover:bg-gray-50/50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selected ? 'bg-teal border-teal' : 'border-gray-300'}`}>
                          {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
            </div>

            <button onClick={handleCompute} disabled={!canSubmit}
              className="w-full btn-teal py-4 text-base font-bold disabled:opacity-40">
              Calculate my Risk Score →
            </button>
            <p className="text-xs text-center text-mid">Free · No login · Under 2 minutes</p>
          </div>
        )}

        {step === 1 && result && scoreData && (
          <div className="space-y-5">

            {/* Score card */}
            <div className={`card text-center space-y-3 border-2 ${scoreData.bg}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-mid">Immigration Risk Score</p>
              <p className="text-[10px] text-mid">Lower = stronger protection · Higher = more at risk</p>
              <p className="text-[9px] text-gray-400 font-mono">Model v2.2 · Policy data current as of May 21, 2026 · Same inputs always return this score</p>
              <div className="relative inline-flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-36 h-36">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke={scoreData.ring}
                    strokeWidth="10"
                    strokeDasharray={`${(result.score / 100) * 327} 327`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="52" textAnchor="middle" style={{ fontSize: 26, fontWeight: 900, fill: '#1B2B6B' }}>{result.score}</text>
                  <text x="60" y="66" textAnchor="middle" style={{ fontSize: 9, fill: '#888' }}>out of 100</text>
                </svg>
              </div>
              <div>
                <p className={`text-2xl font-black ${scoreData.color}`}>{scoreData.label}</p>
                <p className="text-xs font-semibold text-mid mt-0.5">{scoreData.sub}</p>
                <p className="text-sm text-mid mt-2 max-w-sm mx-auto leading-relaxed">{scoreData.advice}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-navy uppercase tracking-widest">Risk Factor Breakdown</p>
                <p className="text-[10px] text-mid">Higher bar = more exposure in that area</p>
              </div>
              {result.breakdown.map((b, i) => {
                const isMitigating = b.points <= 0
                const barPct = b.max > 0 ? Math.min(100, (b.points / b.max) * 100) : 0
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-navy">{b.label}</p>
                      <p className={`text-xs font-bold ${isMitigating ? 'text-teal' : 'text-mid'}`}>
                        {isMitigating && b.points !== 0 ? `${b.points} pts` : b.max > 0 ? `${b.points} / ${b.max}` : '—'}
                      </p>
                    </div>
                    {b.max > 0 && (
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          barPct >= 70 ? 'bg-red-500' :
                          barPct >= 50 ? 'bg-orange-400' :
                          barPct >= 30 ? 'bg-yellow-400' : 'bg-teal'
                        }`} style={{ width: `${barPct}%` }} />
                      </div>
                    )}
                    {isMitigating && b.points !== 0 && (
                      <div className="h-1.5 rounded-full bg-teal/20 overflow-hidden">
                        <div className="h-full rounded-full bg-teal" style={{ width: '100%' }} />
                      </div>
                    )}
                    <p className="text-xs text-mid leading-relaxed">{b.note}</p>
                  </div>
                )
              })}
            </div>

            {/* Share */}
            <div className="card space-y-3">
              <p className="text-sm font-bold text-navy">Share with colleagues</p>
              <p className="text-xs text-mid">Most international professionals aren&apos;t tracking the 2026 policy shifts. Sharing your score could be the nudge someone needs to take action before it&apos;s too late.</p>
              <button onClick={handleCopy} className="w-full btn-outline text-sm">
                {copied ? '✓ Copied to clipboard' : 'Copy shareable text →'}
              </button>
            </div>

            {/* CTA */}
            <div className="card bg-navy text-white text-center space-y-3">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">Reduce Your Exposure</p>
              <p className="text-lg font-bold leading-snug">Get your complete Extraordinary Circumstances Evidence Package</p>
              <p className="text-sm text-white/70 leading-relaxed">A full NIW strategy report, Dhanasar framework analysis, draft petition language, and the exact evidence map you need — built from your actual resume and career record.</p>
              <Link href="/login" className="inline-block bg-teal text-white font-bold px-8 py-3 rounded-xl hover:bg-teal/90 transition-colors">
                Build my evidence package →
              </Link>
              <p className="text-xs text-white/40">$497 one-time · Instant delivery</p>
            </div>

            <button onClick={() => { setStep(0); setResult(null) }} className="w-full text-sm text-mid hover:text-navy underline text-center">
              ← Recalculate
            </button>
          </div>
        )}

        <div className="text-center space-y-1.5 pb-4">
          <p className="text-xs text-mid">Based on PP 10998 (Jan 1, 2026) · State Dept 75-country immigrant visa pause (Jan 21, 2026) · USCIS PM-602-0199 (May 21, 2026) · DHS D/S final rule (pending) · Not legal advice</p>
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
