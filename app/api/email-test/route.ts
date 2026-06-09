import { NextResponse } from 'next/server'

// Diagnostic disabled. Email sending was confirmed working (Postmark 200) once
// FROM_EMAIL was pointed at the verified f-1careers.com domain. Safe to delete this file.
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
