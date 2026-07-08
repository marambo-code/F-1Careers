export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { stripDashesDeep } from '@/lib/sanitize'
import { getPrecedentGroundingAlways } from '@/lib/precedent/grounding'

// Hard timeout inside the route's 60s maxDuration (SDK aborts via
// AbortController), no retries: fail cleanly to the client's error state
// instead of Vercel killing the function mid-response.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 50_000,
  maxRetries: 0,
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Gate behind Pro subscription (trialing counts, consistent with the rest of the app)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()
    if (!sub) return NextResponse.json({ error: 'pro_required' }, { status: 403 })

    const { narrative, pathway } = await req.json()
    if (!narrative?.trim()) return NextResponse.json({ error: 'No narrative provided' }, { status: 400 })

    const pathwayContext = pathway === 'EB-1A'
      ? 'EB-1A Extraordinary Ability (8 CFR §204.5(h)): must demonstrate extraordinary ability and sustained national or international acclaim.'
      : 'EB-2 NIW (Matter of Dhanasar): (1) proposed endeavor has substantial merit and national importance; (2) petitioner is well-positioned to advance it; (3) beneficial to waive the job offer requirement.'

    // Ground the review in real AAO adjudication patterns. Never throws;
    // resolves to '' on any failure so the review still runs.
    const grounding = await getPrecedentGroundingAlways(pathway === 'EB-1A' ? 'EB1A' : 'NIW')

    // Use tool_use to guarantee structured JSON output, eliminates all parsing issues
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      tools: [
        {
          name: 'narrative_review',
          description: 'Submit the adversarial review of a petition narrative',
          input_schema: {
            type: 'object' as const,
            properties: {
              overall: {
                type: 'string',
                description: 'One sentence verdict on the narrative',
              },
              score: {
                type: 'number',
                description: 'Score from 0-100 where 100 means the statement would likely withstand a skeptical adjudicator with no further edits',
              },
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    severity: { type: 'string', enum: ['critical', 'moderate', 'minor'] },
                    quote: { type: 'string', description: 'Short phrase from the text (paraphrase if needed, keep under 10 words)' },
                    problem: { type: 'string', description: 'What is legally wrong' },
                    fix: { type: 'string', description: 'How to rewrite or fix it' },
                  },
                  required: ['severity', 'quote', 'problem', 'fix'],
                },
              },
              strengths: {
                type: 'array',
                items: { type: 'string' },
                description: '1-3 things that are legally solid',
              },
              next_step: {
                type: 'string',
                description: 'The single most important action to take right now',
              },
            },
            required: ['overall', 'score', 'issues', 'strengths', 'next_step'],
          },
        },
      ],
      tool_choice: { type: 'any' },
      messages: [
        {
          role: 'user',
          content: `You are a senior USCIS adjudicator reviewing a petition narrative. Be skeptical and precise.

Pathway: ${pathwayContext}${grounding}

Review this narrative adversarially, find every weakness before they file. Flag:
1. Personal career benefit framing instead of national benefit to the US
2. Vague language an adjudicator could reject (e.g. "significant contributions" without specifics)
3. Undefined or inconsistent proposed endeavor
4. Missing legal elements for this pathway
5. Language that sounds impressive but doesn't legally argue

Call the narrative_review tool with your findings.

NARRATIVE:
${narrative}`,
        },
      ],
    })

    // Extract the tool use result, guaranteed structured, no parsing needed
    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Model did not call the review tool')
    }

    return NextResponse.json(stripDashesDeep(toolUse.input))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[narrative-feedback]', message)
    return NextResponse.json({ error: 'Failed to analyze narrative', detail: message }, { status: 500 })
  }
}
