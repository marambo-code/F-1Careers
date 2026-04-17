/**
 * lib/data/visa-bulletin.ts
 * ─────────────────────────────────────────────────────────────────
 * Static priority date data sourced from the DOS Visa Bulletin.
 * UPDATE MONTHLY: https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html
 *
 * Only countries with meaningful backlogs in EB-1A or EB-2 are listed.
 * All others are "Current" (no backlog).
 */

export const BULLETIN_LAST_UPDATED = 'May 2025'

export type EBCategory = 'EB-1' | 'EB-2' | 'EB-3'
export type BacklogSeverity = 'critical' | 'severe' | 'moderate' | 'minimal' | 'current'

export interface CountryBacklog {
  country: string
  countryCode: string          // ISO 2-letter
  flag: string
  eb1: { date: string | 'Current'; waitYears: number }
  eb2: { date: string | 'Current'; waitYears: number }
  eb3: { date: string | 'Current'; waitYears: number }
  severity: BacklogSeverity    // worst across all categories
  headline: string             // one-line plain-English summary
  recommendation: string       // what this means for the user
}

export const COUNTRY_BACKLOGS: Record<string, CountryBacklog> = {
  IN: {
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    eb1: { date: 'Oct 2022', waitYears: 3 },
    eb2: { date: 'Jan 2013', waitYears: 12 },
    eb3: { date: 'Jun 2013', waitYears: 12 },
    severity: 'critical',
    headline: 'EB-2 NIW backlog is ~12 years for Indian nationals',
    recommendation: 'EB-1A is your most viable path — it has a significantly shorter wait. Prioritize building 3+ EB-1A criteria now.',
  },
  CN: {
    country: 'China',
    countryCode: 'CN',
    flag: '🇨🇳',
    eb1: { date: 'Mar 2023', waitYears: 2 },
    eb2: { date: 'Jul 2020', waitYears: 5 },
    eb3: { date: 'Sep 2020', waitYears: 5 },
    severity: 'severe',
    headline: 'EB-2 backlog is ~5 years for Chinese nationals',
    recommendation: 'EB-1A (shorter wait) is preferable to EB-2 NIW. File EB-1A as soon as you meet 3+ criteria.',
  },
  PH: {
    country: 'Philippines',
    countryCode: 'PH',
    flag: '🇵🇭',
    eb1: { date: 'Current', waitYears: 0 },
    eb2: { date: 'Current', waitYears: 0 },
    eb3: { date: 'Feb 2024', waitYears: 1 },
    severity: 'minimal',
    headline: 'EB-3 has a ~1-year backlog for Filipino nationals',
    recommendation: 'EB-1A and EB-2 NIW are current — no backlog. EB-3 has a minor delay.',
  },
  MX: {
    country: 'Mexico',
    countryCode: 'MX',
    flag: '🇲🇽',
    eb1: { date: 'Current', waitYears: 0 },
    eb2: { date: 'Current', waitYears: 0 },
    eb3: { date: 'Jun 2022', waitYears: 3 },
    severity: 'moderate',
    headline: 'EB-3 has a ~3-year backlog for Mexican nationals',
    recommendation: 'EB-1A and EB-2 NIW are current — focus on these pathways.',
  },
  SV: {
    country: 'El Salvador',
    countryCode: 'SV',
    flag: '🇸🇻',
    eb1: { date: 'Current', waitYears: 0 },
    eb2: { date: 'Current', waitYears: 0 },
    eb3: { date: 'Jun 2022', waitYears: 3 },
    severity: 'moderate',
    headline: 'EB-3 has a ~3-year backlog',
    recommendation: 'EB-1A and EB-2 NIW are current. Pursue these pathways.',
  },
}

export interface ExecutiveAlert {
  id: string
  title: string
  message: string
  affectedCountries: string[]  // ISO codes, or [] for all
  severity: 'warning' | 'critical'
  sourceUrl: string
  effectiveDate: string
}

// Manually updated when EOs or USCIS policy changes affect specific nationalities
// Add/remove entries here as needed — no DB required for country-level alerts
export const EXECUTIVE_ALERTS: ExecutiveAlert[] = [
  // Example — update as policies change:
  // {
  //   id: 'eo-2025-xx',
  //   title: 'Executive Order: Temporary Suspension',
  //   message: 'USCIS has temporarily suspended processing for certain petitioners from [country].',
  //   affectedCountries: ['XX'],
  //   severity: 'critical',
  //   sourceUrl: 'https://uscis.gov/...',
  //   effectiveDate: '2025-01-20',
  // },
]

// ── Helper functions ──────────────────────────────────────────────

export function getCountryBacklog(countryCode: string): CountryBacklog | null {
  return COUNTRY_BACKLOGS[countryCode.toUpperCase()] ?? null
}

export function getExecutiveAlertsForCountry(countryCode: string): ExecutiveAlert[] {
  return EXECUTIVE_ALERTS.filter(a =>
    a.affectedCountries.length === 0 || a.affectedCountries.includes(countryCode.toUpperCase())
  )
}

export function getBacklogSeverityColor(severity: BacklogSeverity): string {
  switch (severity) {
    case 'critical': return 'red'
    case 'severe':   return 'orange'
    case 'moderate': return 'yellow'
    case 'minimal':  return 'blue'
    default:         return 'teal'
  }
}

// ISO 3166-1 alpha-2 country list (common countries for F-1 students)
export const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CO', name: 'Colombia' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'IR', name: 'Iran' },
  { code: 'TR', name: 'Turkey' },
  { code: 'EG', name: 'Egypt' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'KE', name: 'Kenya' },
  { code: 'SN', name: 'Senegal' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'US', name: 'United States' },
  { code: 'OTHER', name: 'Other' },
].sort((a, b) => a.name.localeCompare(b.name))
