import { NextResponse } from 'next/server'

// TEMPORARY diagnostic. Hit /api/email-test?key=f1mailcheck to see exactly what
// Postmark returns for a real send. Remove after debugging. Does not leak the token.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'f1mailcheck') {
    return NextResponse.json({ error: 'Add ?key=f1mailcheck to the URL' }, { status: 401 })
  }

  const token = process.env.POSTMARK_SERVER_TOKEN
  const from = process.env.FROM_EMAIL ?? 'F-1 Careers <support@f-1careers.com>'
  const to = process.env.ATTORNEY_NOTIFY_EMAIL ?? 'support@f-1careers.com'

  if (!token) {
    return NextResponse.json({
      tokenPresent: false,
      from, to,
      diagnosis: 'POSTMARK_SERVER_TOKEN is NOT set in this deployment. That is why nothing sends.',
    })
  }

  let postmarkStatus = 0
  let postmarkBody = ''
  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify({
        From: from,
        To: to,
        Subject: 'F-1 Careers email test',
        HtmlBody: '<p>Diagnostic test from /api/email-test. If you got this, Postmark sending works.</p>',
        MessageStream: 'outbound',
      }),
    })
    postmarkStatus = res.status
    postmarkBody = await res.text()
  } catch (e) {
    return NextResponse.json({ tokenPresent: true, tokenLen: token.length, from, to, fetchError: String(e) })
  }

  return NextResponse.json({
    tokenPresent: true,
    tokenLen: token.length,
    from,
    to,
    postmarkStatus,          // 200 = accepted; anything else = Postmark rejected it
    postmarkBody,            // Postmark's exact message (e.g. ErrorCode 300 = bad From / signature)
  })
}
