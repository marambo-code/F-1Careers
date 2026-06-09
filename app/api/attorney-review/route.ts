import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAttorneyReviewRequest } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId, reportType, consent, note } = await req.json()
    if (!['strategy', 'rfe'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Verify the report belongs to this user
    const { data: report } = await supabase
      .from('reports').select('id').eq('id', reportId).eq('user_id', user.id).maybeSingle()
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    // Insert only if there's no open request yet (avoid duplicate rows), but ALWAYS
    // send the notification below so a click is never silently dropped.
    const { data: existing } = await supabase
      .from('attorney_review_requests').select('id')
      .eq('user_id', user.id).eq('report_id', reportId).neq('status', 'closed').maybeSingle()

    if (!existing) {
      const { error: insErr } = await supabase.from('attorney_review_requests').insert({
        user_id: user.id,
        report_id: reportId,
        report_type: reportType,
        consent_share: !!consent,
        note: note ?? null,
      })
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    // Await so the serverless function does not freeze before Postmark responds.
    let emailResult: string = 'no-user-email'
    if (user.email) {
      try {
        emailResult = await sendAttorneyReviewRequest({
          userEmail: user.email, reportType, reportId, consentShare: !!consent, note,
        })
      } catch (e) {
        emailResult = 'error: ' + (e instanceof Error ? e.message : String(e))
        console.error('[attorney-review] notify failed:', e)
      }
    }

    return NextResponse.json({ ok: true, already: !!existing, emailResult })
  } catch (e) {
    console.error('[attorney-review] error:', e)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
