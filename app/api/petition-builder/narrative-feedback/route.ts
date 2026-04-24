/**
 * POST /api/petition-builder/narrative-feedback
 * ─────────────────────────────────────────────
 * Runs an adversarial review of the user's proposed endeavor statement.
 * Acts like a USCIS adjudicator: flags personal-benefit framing,
 * vague language, and anything that diverges from the legal standard.
 *
 * Rate limit: 10 reviews per 24h per user.
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Check Pro
    const { data: sub } = await service
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (sub?.status !== 'active' && sub?.status !== 'trialing') {
      return NextResponse.json({ error: 'pro_required' }, { status: 403 })
    }

    // Rate limit
    const rateLimit = await checkRateLimit(user.id, 'narrative-feedback')
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'rate_limited', message: `Limit reached. Resets at ${rateLimit.resetAt.toLocaleTimeString()}` }, { status: 429 })
    }

    const { narrative, pathway } = await req.json()
    if (!narrative?.trim()) return NextResponse.json({ error: 'No narrative provided' }, { status: 400 })

    const pathwayContext = pathway === 'EB-1A'
      ? 'EB-1A Extraordinary Ability (8 CFR §204.5(h)). The petition must demonstrate extraordinary ability — the sustained national or international acclaim of the beneficiary in their field.'
      : 'EB-2 NIW National Interest Waiver under Matter of Dhanasar (26 I&N Dec. 884). The three prongs are: (1) the proposed endeavor has substantial merit and national importance; (2) the petitioner is well-positioned to advance the endeavor; (3) on balance, it would be beneficial to the United States to waive the job offer requirement.'

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a senior USCIS adjudicator reviewing an immigration petition. You are skeptical, precise, and enforce the legal standard strictly.

The petitioner is filing under: ${pathwayContext}

Below is their proposed endeavor / personal statement draft. Review it adversarially — your job is to find every weakness BEFORE they file, so they can fix it.

Flag:
1. Any sentence where the framing is about the petitioner's personal career benefit rather than national benefit to the United States
2. Vague language that an adjudicator could reject ("significant contributions," "advancing the field" — without specifics)
3. Any place where the "proposed endeavor" is undefined, inconsistent, or would be interpreted differently by different readers
4. Missing legal elements required under the framework above
5. Language that sounds like it was written to impress rather than to legally argue

Return your feedback as a JSON object with this exact structure:
{
  "overall": "one sentence verdict: Ready to file / Needs work / Major issues",
  "score": number between 0-100 (100 = filing ready),
  "issues": [
    {
      "severity": "critical" | "moderate" | "minor",
      "quote": "the exact phrase from the text that is problematic",
      "problem": "what's wrong with it legally",
      "fix": "specific rewrite suggestion"
    }
  ],
  "strengths": ["list of 1-3 things that are legally solid"],
  "next_step": "single most important thing to do right now"
}

If the text is empty or too short to review, return score: 0 and a single critical issue asking them to write their endeavor statement.

NARRATIVE TO REVIEW:
---
${narrative}
---

Return only valid JSON. No markdown, no explanation outside the JSON.`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Try to extract JSON from the response
      const match = text.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else throw new Error('Failed to parse AI response')
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('[narrative-feedback]', error)
    return NextResponse.json({ error: 'Failed to analyze narrative' }, { status: 500 })
  }
}
