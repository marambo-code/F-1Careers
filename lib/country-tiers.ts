/**
 * Country immigration tier data for the ROI calculator.
 *
 * HOW TO UPDATE:
 *   1. Short-term: edit this file and redeploy.
 *   2. Long-term: migrate to a Supabase `country_tiers` table and fetch
 *      from the client, the calculator falls back to this static data.
 *
 * TIERS:
 *   'ban'     , full travel ban (PP 10998): no immigrant visa consular path;
 *                nationals cannot obtain a new immigrant visa abroad.
 *   'blocked' , immigrant visa pause (State Dept, Jan 21 2026): consular
 *                processing suspended, no published resumption date.
 *   'backlog' , EB priority date backlog: consular path exists but wait is
 *                years-long due to per-country quotas.
 *   'open'    , standard: consulate operational, no special restrictions.
 *
 * RISK LOGIC (critical, do not confuse):
 *   'ban'  = HIGHEST exposure. No consular fallback. If status disrupted,
 *            there is no path to return via immigrant visa.
 *   'blocked' = HIGH exposure. No fallback path right now.
 *   'backlog' = ELEVATED. Mobility locked for years even with I-140.
 *   'open'  = BASELINE. Consular path exists; disruption = months away.
 *
 * Last verified: 2026-05-26
 * Sources: PP 10998 (Jan 1 2026) · State Dept IV pause (Jan 21 2026) ·
 *          USCIS EB Visa Bulletin (May 2026)
 */

export type Tier = 'ban' | 'blocked' | 'backlog' | 'open'

export interface CountryEntry {
  tier: Tier
  minMonths: number   // planning-estimate floor (consular or disruption window)
  maxMonths: number   // planning-estimate ceiling
  label: string       // display text in dropdown
  policyNote?: string // shown in the UI warning banner
}

export const TIERS_LAST_VERIFIED = '2026-05-26'

// ---------------------------------------------------------------------------
// Full Travel Ban, PP 10998 (effective Jan 1, 2026)
// Nationals cannot obtain new immigrant visas through consular processing.
// AoS is the only path. If status is lost, return may be impossible.
// ---------------------------------------------------------------------------
const BAN_COUNTRIES: Record<string, CountryEntry> = {
  'Afghanistan':       { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Afghanistan', policyNote: 'Full travel ban, PP 10998' },
  'Burma / Myanmar':   { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Burma / Myanmar', policyNote: 'Full travel ban, PP 10998' },
  'Burkina Faso':      { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Burkina Faso', policyNote: 'Full travel ban, PP 10998' },
  'Chad':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Chad', policyNote: 'Full travel ban, PP 10998' },
  'Republic of Congo': { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Republic of Congo', policyNote: 'Full travel ban, PP 10998' },
  'Cuba':              { tier: 'ban', minMonths: 24, maxMonths:  84, label: 'Cuba', policyNote: 'Partial travel ban + immigrant visa restrictions' },
  'Equatorial Guinea': { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Equatorial Guinea', policyNote: 'Full travel ban, PP 10998' },
  'Eritrea':           { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Eritrea', policyNote: 'Full travel ban, PP 10998' },
  'Haiti':             { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Haiti', policyNote: 'Full travel ban, PP 10998' },
  'Iran':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Iran', policyNote: 'Full travel ban, PP 10998' },
  'Laos':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Laos', policyNote: 'Full travel ban, PP 10998' },
  'Libya':             { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Libya', policyNote: 'Full travel ban, PP 10998' },
  'Mali':              { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Mali', policyNote: 'Full travel ban, PP 10998' },
  'Niger':             { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Niger', policyNote: 'Full travel ban, PP 10998' },
  'Sierra Leone':      { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Sierra Leone', policyNote: 'Full travel ban, PP 10998' },
  'Somalia':           { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Somalia', policyNote: 'Full travel ban, PP 10998' },
  'South Sudan':       { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'South Sudan', policyNote: 'Full travel ban, PP 10998' },
  'Sudan':             { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Sudan', policyNote: 'Full travel ban, PP 10998' },
  'Syria':             { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Syria', policyNote: 'Full travel ban, PP 10998' },
  'Venezuela':         { tier: 'ban', minMonths: 24, maxMonths:  84, label: 'Venezuela', policyNote: 'Partial travel ban + immigrant visa restrictions' },
  'Yemen':             { tier: 'ban', minMonths: 36, maxMonths: 120, label: 'Yemen', policyNote: 'Full travel ban, PP 10998' },
}

// ---------------------------------------------------------------------------
// Immigrant Visa Pause + Partial Travel Ban (PP 10998 partial suspension)
// ---------------------------------------------------------------------------
const PARTIAL_BAN_BLOCKED: Record<string, CountryEntry> = {
  'Angola':       { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Angola', policyNote: 'Partial travel ban, PP 10998' },
  'Benin':        { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Benin', policyNote: 'Partial travel ban, PP 10998' },
  'Burundi':      { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Burundi', policyNote: 'Partial travel ban, PP 10998' },
  'Gabon':        { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Gabon', policyNote: 'Partial travel ban, PP 10998' },
  'Gambia':       { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Gambia', policyNote: 'Partial travel ban + immigrant visa pause' },
  'Ivory Coast':  { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Ivory Coast (Côte d\'Ivoire)', policyNote: 'Partial travel ban + immigrant visa pause' },
  'Malawi':       { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Malawi', policyNote: 'Partial travel ban, PP 10998' },
  'Mauritania':   { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Mauritania', policyNote: 'Partial travel ban, PP 10998' },
  'Nigeria':      { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Nigeria', policyNote: 'Partial travel ban + immigrant visa pause' },
  'Senegal':      { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Senegal', policyNote: 'Partial travel ban + immigrant visa pause' },
  'Tanzania':     { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Tanzania', policyNote: 'Partial travel ban + immigrant visa pause' },
  'Togo':         { tier: 'blocked', minMonths: 18, maxMonths: 60, label: 'Togo', policyNote: 'Partial travel ban + immigrant visa pause' },
  'Tonga':        { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Tonga', policyNote: 'Partial travel ban, PP 10998' },
  'Turkmenistan': { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Turkmenistan', policyNote: 'Partial travel ban, PP 10998' },
  'Zambia':       { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Zambia', policyNote: 'Partial travel ban, PP 10998' },
  'Zimbabwe':     { tier: 'blocked', minMonths: 18, maxMonths: 54, label: 'Zimbabwe', policyNote: 'Partial travel ban, PP 10998' },
}

// ---------------------------------------------------------------------------
// Immigrant Visa Pause, State Dept (Jan 21, 2026), no resumption date set
// ---------------------------------------------------------------------------
const IV_PAUSE_BLOCKED: Record<string, CountryEntry> = {
  'Albania':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Albania', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Algeria':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Algeria', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Armenia':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Armenia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Azerbaijan':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Azerbaijan', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Bahamas':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bahamas', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Bangladesh':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bangladesh', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Barbados':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Barbados', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Belarus':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Belarus', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Belize':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Belize', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Bhutan':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bhutan', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Bosnia':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Bosnia and Herzegovina', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Brazil':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Brazil', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Cambodia':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Cambodia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Cameroon':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Cameroon', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Cape Verde':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Cape Verde', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Colombia':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Colombia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'DR Congo':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'DR Congo (Democratic Republic)', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Egypt':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Egypt', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Ethiopia':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Ethiopia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Fiji':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Fiji', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Georgia':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Georgia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Ghana':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Ghana', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Grenada':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Grenada', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Guatemala':        { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Guatemala', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Guinea':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Guinea', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Iraq':             { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Iraq', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Jamaica':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Jamaica', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Jordan':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Jordan', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Kazakhstan':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kazakhstan', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Kosovo':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kosovo', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Kuwait':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kuwait', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Kyrgyzstan':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Kyrgyzstan', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Lebanon':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Lebanon', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Liberia':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Liberia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Moldova':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Moldova', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Mongolia':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Mongolia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Montenegro':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Montenegro', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Morocco':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Morocco', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Mozambique':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Mozambique', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Nepal':            { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Nepal', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Nicaragua':        { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Nicaragua', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'North Macedonia':  { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'North Macedonia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Pakistan':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Pakistan', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Russia':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Russia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Rwanda':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Rwanda', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Thailand':         { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Thailand', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Tunisia':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Tunisia', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Uganda':           { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Uganda', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Uruguay':          { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Uruguay', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
  'Uzbekistan':       { tier: 'blocked', minMonths: 12, maxMonths: 36, label: 'Uzbekistan', policyNote: 'Immigrant visa pause, State Dept Jan 2026' },
}

// ---------------------------------------------------------------------------
// EB Priority Date Backlog, per-country quota creates multi-year waits
// ---------------------------------------------------------------------------
const BACKLOG_COUNTRIES: Record<string, CountryEntry> = {
  'India':       { tier: 'backlog', minMonths: 36, maxMonths: 84, label: 'India', policyNote: 'Severe EB priority date backlog, 3–7+ year estimated wait' },
  'China':       { tier: 'backlog', minMonths: 24, maxMonths: 60, label: 'China (mainland-born)', policyNote: 'Significant EB backlog, 2–5+ year estimated wait' },
  'Mexico':      { tier: 'backlog', minMonths: 12, maxMonths: 36, label: 'Mexico', policyNote: 'EB backlog in several categories, 1–3 year estimated wait' },
  'Philippines': { tier: 'backlog', minMonths: 12, maxMonths: 30, label: 'Philippines', policyNote: 'EB backlog in several categories, 1–2.5 year estimated wait' },
}

// ---------------------------------------------------------------------------
// Consulate Operational, standard processing, no special restrictions
// ---------------------------------------------------------------------------
const OPEN_COUNTRIES: Record<string, CountryEntry> = {
  'Andorra':              { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Andorra' },
  'Antigua and Barbuda':  { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Antigua and Barbuda' },
  'Argentina':            { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Argentina' },
  'Australia':            { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Australia' },
  'Austria':              { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Austria' },
  'Bahrain':              { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Bahrain' },
  'Belgium':              { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Belgium' },
  'Bolivia':              { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Bolivia' },
  'Botswana':             { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Botswana' },
  'Brunei':               { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Brunei' },
  'Bulgaria':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Bulgaria' },
  'Canada':               { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Canada' },
  'Chile':                { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Chile' },
  'Costa Rica':           { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Costa Rica' },
  'Croatia':              { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Croatia' },
  'Cyprus':               { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Cyprus' },
  'Czech Republic':       { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Czech Republic' },
  'Denmark':              { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Denmark' },
  'Dominican Republic':   { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Dominican Republic' },
  'Ecuador':              { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Ecuador' },
  'El Salvador':          { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'El Salvador' },
  'Estonia':              { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Estonia' },
  'eSwatini':             { tier: 'open', minMonths: 10, maxMonths: 20, label: 'eSwatini (Swaziland)' },
  'Finland':              { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Finland' },
  'France':               { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'France' },
  'Germany':              { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Germany' },
  'Greece':               { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Greece' },
  'Honduras':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Honduras' },
  'Hong Kong':            { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Hong Kong' },
  'Hungary':              { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Hungary' },
  'Iceland':              { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Iceland' },
  'Indonesia':            { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Indonesia' },
  'Ireland':              { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Ireland' },
  'Israel':               { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Israel' },
  'Italy':                { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Italy' },
  'Japan':                { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Japan' },
  'Kenya':                { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Kenya' },
  'Latvia':               { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Latvia' },
  'Lesotho':              { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Lesotho' },
  'Liechtenstein':        { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Liechtenstein' },
  'Lithuania':            { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Lithuania' },
  'Luxembourg':           { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Luxembourg' },
  'Madagascar':           { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Madagascar' },
  'Malaysia':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Malaysia' },
  'Maldives':             { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Maldives' },
  'Malta':                { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Malta' },
  'Mauritius':            { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Mauritius' },
  'Monaco':               { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Monaco' },
  'Namibia':              { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Namibia' },
  'Netherlands':          { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Netherlands' },
  'New Zealand':          { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'New Zealand' },
  'Norway':               { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Norway' },
  'Oman':                 { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Oman' },
  'Panama':               { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Panama' },
  'Papua New Guinea':     { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Papua New Guinea' },
  'Paraguay':             { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Paraguay' },
  'Peru':                 { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Peru' },
  'Poland':               { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Poland' },
  'Portugal':             { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Portugal' },
  'Qatar':                { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Qatar' },
  'Romania':              { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Romania' },
  'Saint Kitts and Nevis':{ tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Saint Kitts and Nevis' },
  'Saint Lucia':          { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Saint Lucia' },
  'Saudi Arabia':         { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Saudi Arabia' },
  'Serbia':               { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Serbia' },
  'Seychelles':           { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Seychelles' },
  'Singapore':            { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Singapore' },
  'Slovakia':             { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Slovakia' },
  'Slovenia':             { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Slovenia' },
  'South Africa':         { tier: 'open', minMonths: 10, maxMonths: 20, label: 'South Africa' },
  'South Korea':          { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'South Korea' },
  'Spain':                { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'Spain' },
  'Sri Lanka':            { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Sri Lanka' },
  'Suriname':             { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Suriname' },
  'Sweden':               { tier: 'open', minMonths: 7,  maxMonths: 14, label: 'Sweden' },
  'Switzerland':          { tier: 'open', minMonths: 8,  maxMonths: 15, label: 'Switzerland' },
  'Taiwan':               { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Taiwan' },
  'Timor-Leste':          { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Timor-Leste (East Timor)' },
  'Trinidad and Tobago':  { tier: 'open', minMonths: 9,  maxMonths: 18, label: 'Trinidad and Tobago' },
  'Turkey':               { tier: 'open', minMonths: 10, maxMonths: 18, label: 'Turkey' },
  'Ukraine':              { tier: 'open', minMonths: 12, maxMonths: 24, label: 'Ukraine (limited consular capacity)' },
  'United Arab Emirates': { tier: 'open', minMonths: 10, maxMonths: 20, label: 'United Arab Emirates' },
  'United Kingdom':       { tier: 'open', minMonths: 8,  maxMonths: 16, label: 'United Kingdom' },
  'Vietnam':              { tier: 'open', minMonths: 10, maxMonths: 20, label: 'Vietnam' },
}

// ---------------------------------------------------------------------------
// Combined export, single source of truth
// ---------------------------------------------------------------------------
export const COUNTRY_DATA: Record<string, CountryEntry> = {
  ...BAN_COUNTRIES,
  ...PARTIAL_BAN_BLOCKED,
  ...IV_PAUSE_BLOCKED,
  ...BACKLOG_COUNTRIES,
  ...OPEN_COUNTRIES,
}

export const TIER_ORDER: Tier[] = ['ban', 'blocked', 'backlog', 'open']

export const TIER_GROUP_LABELS: Record<Tier, string> = {
  ban:     '── Full Travel Ban (PP 10998), highest risk ──',
  blocked: '── Immigrant Visa Pause (Jan 2026), high risk ──',
  backlog: '── EB Priority Date Backlog, elevated risk ──',
  open:    '── Consulate Operational, baseline risk ──',
}
