export const maxDuration = 90

/**
 * POST /api/petition-builder/rec-letter-brief
 * ─────────────────────────────────────────────
 * Generates a personalized recommender briefing document for a specific
 * recommender on a NIW or EB-1A petition.
 *
 * The briefing tells the recommender:
 *   1. Their specific role in the petition argument
 *   2. Exactly which criteria/prongs to address (based on their relationship)
 *   3. Language USCIS expects to see
 *   4. What NOT to write
 *   5. A structural outline they can follow
 *
 * Rate limit: 20 briefings per 24h per user.
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type RelationshipType = 'independent_expert' | 'collaborator' | 'supervisor' | 'employer'

function buildBriefingPrompt(
  pathway: string,
  recommender: { name: string; title: string; institution: string; relationship: RelationshipType },
  petitionerProfile: Record<string, string>,
  narrative: string,
): string {
  const pathwayContext =
    pathway === 'EB-1A'
      ? 'EB-1A Extraordinary Ability (8 CFR §204.5(h)). The petition must demonstrate sustained national or international acclaim.'
      : 'EB-2 NIW National Interest Waiver (Matter of Dhanasar, 26 I&N Dec. 884). The three prongs are: (1) substantial merit and national importance of the endeavor; (2) the petitioner is well-positioned to advance the endeavor; (3) it would benefit the US to waive the job offer requirement.'

  const relationshipGuidance: Record<RelationshipType, string> = {
    independent_expert: `This recommender has no professional or personal relationship with the petitioner. Their letter carries the most weight because USCIS views it as objective. They should: (a) explain how they independently learned of the petitioner's work, (b) speak to the field-wide significance of the research/work, not just the individual, (c) confirm the petitioner's standing in the broader community. They should NOT mention how they met the petitioner.`,
    collaborator: `This recommender has worked directly with the petitioner on research or projects. They should: (a) describe specific joint work and the petitioner's unique intellectual contribution vs. the team's, (b) explain the petitioner's leadership or key decision-making role, (c) speak to outcomes and their significance. They should be careful to distinguish the petitioner's individual contributions from team results.`,
    supervisor: `This recommender supervised the petitioner (e.g., PhD advisor, PI, department head). They should: (a) speak to the petitioner's exceptional abilities beyond what is typical for their level, (b) describe specific projects and outcomes that demonstrate extraordinary ability, (c) quantify impact where possible. They should avoid language that sounds like a general reference, focus on specifics only USCIS can act on.`,
    employer: `This recommender is the petitioner's current or recent employer. They should: (a) describe the petitioner's critical role in the organization, (b) explain why that role cannot be easily filled by a US worker with ordinary qualifications, (c) speak to business impact in concrete terms. Note: employer letters can raise questions about self-interest, they must be as specific and evidence-based as possible.`,
  }

  const petitionerName = petitionerProfile.full_name || '[Petitioner Name]'
  const petitionerField = petitionerProfile.field_of_study || petitionerProfile.job_title || '[field]'
  const petitionerEmployer = petitionerProfile.current_employer || '[employer]'

  return `You are a veteran immigration attorney who has filed hundreds of successful EB-2 NIW and EB-1A petitions. You are generating a RECOMMENDER BRIEFING, a private guidance document the petitioner sends to their letter writer before the letter writer drafts their recommendation letter.

PETITION DETAILS:
- Pathway: ${pathwayContext}
- Petitioner: ${petitionerName}
- Field: ${petitionerField}
- Employer: ${petitionerEmployer}

PETITIONER'S PROPOSED ENDEAVOR (from their narrative draft):
---
${narrative || '[No narrative provided, recommender should ask petitioner to share their proposed endeavor statement before writing]'}
---

RECOMMENDER:
- Name: ${recommender.name}
- Title/Position: ${recommender.title}
- Institution: ${recommender.institution}
- Relationship to Petitioner: ${recommender.relationship.replace('_', ' ')}

RELATIONSHIP CONTEXT FOR THIS LETTER TYPE:
${relationshipGuidance[recommender.relationship]}

Write a complete, professional recommender briefing document. Format it as if you are writing it to ${recommender.name} personally, a polished briefing memo they can use to write the strongest possible letter.

The briefing must include:

1. **Why this letter matters**, explain to the recommender their specific role in the petition argument (1 short paragraph, plain English)

2. **Your role in the argument**, explain specifically what USCIS needs THIS letter to establish (2-3 sentences, pathway-specific)

3. **What to address**, a numbered list of 4-6 specific points the recommender should cover. For each point:
   - The specific claim USCIS needs proven
   - Specific language/phrasing that works for USCIS
   - An example of the kind of evidence or observation the recommender should cite

4. **What NOT to write**, 4-5 specific mistakes to avoid. Be blunt. Include: generic praise, personal relationship language, vague superlatives, anything that could indicate familiarity bias

5. **Suggested letter structure**, a clear outline: Opening / Body sections (labeled) / Closing, with 1-2 sentence description of what goes in each section. Recommend a target length (typically 1.5–2 pages).

6. **Key legal language to include**, 3-5 specific phrases, quotes, or framings that immigration adjudicators expect to see (with brief explanation of why each phrase matters legally)

7. **Before you write: questions to ask the petitioner**, 3-5 specific questions the recommender should ask the petitioner before drafting, to ensure they have the specific facts needed

Write in a warm but professional tone. The recommender may not know anything about immigration petitions, explain clearly without assuming legal knowledge. The goal is to empower them to write a letter that could genuinely change the outcome of this petition.

Do not use excessive headers or bullet overload, write the body sections as readable prose where appropriate.`
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Pro check
    const { data: sub } = await service
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (sub?.status !== 'active' && sub?.status !== 'trialing') {
      return NextResponse.json({ error: 'pro_required' }, { status: 403 })
    }

    // Rate limit
    const rateLimit = await checkRateLimit(user.id, 'rec-letter-brief')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: `Limit reached. Resets at ${rateLimit.resetAt.toLocaleTimeString()}` },
        { status: 429 }
      )
    }

    const { recommender, pathway, narrative } = await req.json()

    if (!recommender?.name?.trim()) {
      return NextResponse.json({ error: 'Recommender name required' }, { status: 400 })
    }

    // Load profile
    const { data: profile } = await service
      .from('profiles')
      .select('full_name, field_of_study, job_title, current_employer, university')
      .eq('id', user.id)
      .single()

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: buildBriefingPrompt(
          pathway ?? 'NIW',
          recommender,
          (profile as Record<string, string>) ?? {},
          narrative ?? '',
        ),
      }],
    })

    const briefing = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ briefing })
  } catch (error) {
    console.error('[rec-letter-brief]', error)
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 })
  }
}
