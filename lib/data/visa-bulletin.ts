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
    recommendation: 'EB-1A is your most viable path, it has a significantly shorter wait. Prioritize building 3+ EB-1A criteria now.',
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
    recommendation: 'EB-1A and EB-2 NIW are current, no backlog. EB-3 has a minor delay.',
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
    recommendation: 'EB-1A and EB-2 NIW are current, focus on these pathways.',
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
// Add/remove entries here as needed, no DB required for country-level alerts
export const EXECUTIVE_ALERTS: ExecutiveAlert[] = [
  // Example, update as policies change:
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

// ISO 3166-1 alpha-2, comprehensive world country list
export const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CD', name: 'Congo (DRC)' },
  { code: 'CG', name: 'Congo (Republic)' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
].sort((a, b) => a.name.localeCompare(b.name))
