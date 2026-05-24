import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { company_name, contact_name, contact_email, company_size, international_headcount, message } = body

    if (!company_name || !contact_name || !contact_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = createServiceClient()
    const { error } = await service.from('employer_leads').insert({
      company_name, contact_name, contact_email,
      company_size: company_size ?? null,
      international_headcount: international_headcount ?? null,
      message: message ?? null,
    })

    if (error) {
      console.error('Employer lead insert error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Employer lead error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
