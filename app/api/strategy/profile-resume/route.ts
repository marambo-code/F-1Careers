import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/strategy/profile-resume
// Downloads and parses the resume stored in the user's profile
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('resume_path, resume_filename')
      .eq('id', user.id)
      .single()

    if (!profile?.resume_path) {
      return NextResponse.json({ error: 'No resume on profile' }, { status: 404 })
    }

    const service = createServiceClient()
    const { data: fileData, error: downloadError } = await service.storage
      .from('resumes')
      .download(profile.resume_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download resume' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const pdfParse = require('pdf-parse')
    const parsed = await pdfParse(buffer)
    const text = parsed.text.slice(0, 8000).trim()

    return NextResponse.json({
      text,
      filename: profile.resume_filename ?? 'resume.pdf',
      wordCount: text.split(/\s+/).length,
    })
  } catch (err) {
    console.error('Profile resume parse error:', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
