/**
 * GET /api/processing-times
 * Fetches current I-140 processing times from USCIS.
 * Cached for 24 hours (revalidate).
 *
 * USCIS public endpoint: https://egov.uscis.gov/processing-times/
 */

import { NextResponse } from 'next/server'

export const revalidate = 86400 // 24 hours

const SERVICE_CENTERS = [
  { code: 'NBC', name: 'Nebraska Service Center' },
  { code: 'TSC', name: 'Texas Service Center' },
]

interface ProcessingTime {
  serviceCenter: string
  formType: string
  minMonths: number
  maxMonths: number
  lastUpdated: string
}

export async function GET() {
  try {
    const results: ProcessingTime[] = []

    for (const sc of SERVICE_CENTERS) {
      const url = `https://egov.uscis.gov/processing-times/api/processingtime/I-140/${encodeURIComponent(sc.name)}`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 },
      })

      if (!res.ok) continue

      const data = await res.json()

      // Parse USCIS response format
      const rows = data?.data?.processing_time?.subtypes ?? []
      for (const row of rows) {
        if (
          row.subtype_name?.includes('Extraordinary') ||
          row.subtype_name?.includes('National Interest') ||
          row.subtype_name?.includes('EB-1') ||
          row.subtype_name?.includes('EB-2')
        ) {
          results.push({
            serviceCenter: sc.code,
            formType: row.subtype_name,
            minMonths: row.range?.[0] ?? 0,
            maxMonths: row.range?.[1] ?? 0,
            lastUpdated: data?.data?.processing_time?.publication_date ?? new Date().toISOString(),
          })
        }
      }
    }

    if (results.length > 0) {
      return NextResponse.json({ times: results, source: 'uscis', fetched: new Date().toISOString() })
    }

    // Fallback: static estimates (update when USCIS data is unavailable)
    return NextResponse.json({
      times: [
        { serviceCenter: 'NBC', formType: 'EB-1A Extraordinary Ability', minMonths: 6, maxMonths: 12, lastUpdated: '2025-04-01' },
        { serviceCenter: 'NBC', formType: 'EB-2 NIW National Interest Waiver', minMonths: 8, maxMonths: 14, lastUpdated: '2025-04-01' },
      ],
      source: 'fallback',
      fetched: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      times: [
        { serviceCenter: 'NBC', formType: 'EB-1A Extraordinary Ability', minMonths: 6, maxMonths: 12, lastUpdated: '2025-04-01' },
        { serviceCenter: 'NBC', formType: 'EB-2 NIW National Interest Waiver', minMonths: 8, maxMonths: 14, lastUpdated: '2025-04-01' },
      ],
      source: 'fallback',
      fetched: new Date().toISOString(),
    })
  }
}
