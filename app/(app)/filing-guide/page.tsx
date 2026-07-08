import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FilingGuidePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: petition } = await supabase
    .from('petition_progress')
    .select('pathway, evidence_items, narrative_text, generated_petition')
    .eq('user_id', user.id)
    .maybeSingle()

  const pathway = petition?.pathway ?? 'NIW'
  const isNIW = pathway === 'NIW'

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/petition-builder" className="text-xs text-mid hover:text-navy transition-colors">← Petition Builder</Link>
        </div>
        <h1 className="text-2xl font-bold text-navy">Filing Guide</h1>
        <p className="text-sm text-mid mt-1">
          How to physically submit your {isNIW ? 'EB-2 NIW' : 'EB-1A'} I-140 petition to USCIS.
          This covers the forms, fees, exhibit assembly, and mailing instructions.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
          <span className="text-orange-600 text-xs">⚠️</span>
          <span className="text-xs text-orange-700 font-medium">Not legal advice. Immigration law changes frequently, verify all details at uscis.gov before filing.</span>
        </div>
      </div>

      {/* Pathway selector info */}
      <div className="card !p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
          {isNIW ? 'NIW' : 'EB1'}
        </div>
        <div>
          <p className="text-sm font-bold text-navy">
            {isNIW ? 'EB-2 National Interest Waiver (NIW)' : 'EB-1A Extraordinary Ability'}
          </p>
          <p className="text-xs text-mid mt-0.5 leading-relaxed">
            {isNIW
              ? 'Adjudicated under Matter of Dhanasar (26 I&N Dec. 884). You waive the requirement for a job offer and labor certification by demonstrating your work serves the national interest.'
              : 'Adjudicated under 8 CFR §204.5(h). You must demonstrate sustained national or international acclaim in your field through at least 3 of 10 regulatory criteria.'}
          </p>
        </div>
      </div>

      {/* ─── Step 1: Forms ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-navy border-b border-gray-100 pb-2">Step 1, Complete the Required Forms</h2>

        <div className="space-y-3">
          <FormCard
            name="Form I-140"
            fullName="Immigrant Petition for Alien Workers"
            description={
              isNIW
                ? 'The core petition form. Select "National Interest Waiver" under Part 2, Question 2. You are both the petitioner and beneficiary, check "Self" where applicable.'
                : 'The core petition form. Select "Extraordinary Ability" (EB-1A) under Part 2, Question 1. You are both the petitioner and beneficiary.'
            }
            url="https://www.uscis.gov/i-140"
            fee={isNIW ? '$700' : '$700'}
            notes={[
              'Download the latest version from uscis.gov, do not use old versions',
              'Fill out Part 5 (Basic Information About the Beneficiary) with your own information',
              isNIW ? 'Part 6 requires your employer info, for NIW self-petitions, use your own name/employer' : null,
              'Sign in blue or black ink, or sign digitally if filing online',
            ].filter(Boolean) as string[]}
          />

          <FormCard
            name="Form I-485"
            fullName="Application to Register Permanent Residence (only if visa number immediately available)"
            description="If your priority date is current when you file (check the Visa Bulletin at travel.state.gov), you may be able to concurrently file I-485 to adjust status without leaving the US. Consult an attorney before doing this."
            url="https://www.uscis.gov/i-485"
            fee="$1,440 (adult)"
            optional
            notes={[
              'Only file concurrently if your visa category and country of birth have a current priority date',
              'India and China-born applicants in EB-2/EB-3 face backlogs of 10+ years, do not file I-485 now',
              'Filing I-485 concurrently allows you to apply for work authorization (I-765) and travel permit (I-131)',
            ]}
          />
        </div>
      </section>

      {/* ─── Step 2: Documents ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-navy border-b border-gray-100 pb-2">Step 2, Assemble Your Exhibit Package</h2>
        <p className="text-xs text-mid leading-relaxed">
          Your exhibits are the physical evidence that supports the claims in your personal statement.
          Organize them in the exact order your cover letter references them (Exhibit A, B, C…).
          Each exhibit needs a labeled divider tab.
        </p>

        <div className="card !p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-navy uppercase tracking-wide">
              {isNIW ? 'NIW, Recommended Exhibit Order' : 'EB-1A, Recommended Exhibit Order'}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {(isNIW ? NIW_EXHIBITS : EB1A_EXHIBITS).map((exhibit, i) => (
              <div key={i} className="px-5 py-3.5 flex gap-4">
                <div className="w-8 h-6 rounded bg-navy/8 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-navy">{String.fromCharCode(65 + i)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-navy">{exhibit.label}</p>
                  <p className="text-[11px] text-mid mt-0.5 leading-relaxed">{exhibit.description}</p>
                  {exhibit.prong && (
                    <span className="text-[10px] font-medium text-teal mt-1 inline-block">{exhibit.prong}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-navy/4 border border-navy/10 p-4 space-y-1.5">
          <p className="text-xs font-bold text-navy">Exhibit preparation tips</p>
          <div className="space-y-1">
            {[
              'Print each exhibit and add a labeled tab (Exhibit A, B, C…)',
              'Published papers: include the full article, not just the abstract',
              'Citation counts: screenshot from Google Scholar showing the number and citing papers',
              'Letters of recommendation: must be signed originals (or email-signed PDF)',
              'Media coverage: print the full article with website URL and date visible',
              'Keep a copy of everything you submit',
            ].map((tip, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-teal text-xs flex-shrink-0 mt-0.5">·</span>
                <p className="text-xs text-mid">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Step 3: Fee payment ───────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-navy border-b border-gray-100 pb-2">Step 3, Prepare Filing Fee Payment</h2>

        <div className="card !p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {[
              { label: 'I-140 base fee', amount: '$700', note: 'Required' },
              { label: 'Premium processing', amount: '$2,805', note: 'Optional, 15 calendar days (EB-1A) or 45 (NIW)' },
              { label: 'Biometrics (I-485)', amount: '$85', note: 'Only if filing I-485 concurrently' },
              { label: 'I-485 filing fee', amount: '$1,440', note: 'Only if filing I-485 concurrently' },
            ].map(fee => (
              <div key={fee.label} className="rounded-xl border border-gray-200 p-3">
                <p className="text-sm font-bold text-navy">{fee.amount}</p>
                <p className="text-xs text-mid mt-0.5">{fee.label}</p>
                <p className="text-[10px] text-mid mt-0.5">{fee.note}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-navy">Payment options</p>
            {[
              'Check or money order payable to "U.S. Department of Homeland Security"',
              'Credit card: complete Form G-1450 (Authorization for Credit Card Transactions)',
              'Do NOT make check payable to USCIS, it must say "U.S. Department of Homeland Security"',
            ].map((note, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-teal text-xs flex-shrink-0">·</span>
                <p className="text-xs text-mid">{note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs font-semibold text-yellow-900">Should you use premium processing?</p>
            <p className="text-xs text-yellow-800 mt-1 leading-relaxed">
              Premium processing ($2,805) guarantees adjudicative action within 15 calendar days for EB-1A or 45 calendar days for NIW, either approval, denial, or RFE.
              Standard processing for NIW is currently 6-12 months. If you need status certainty quickly, premium is worth it.
              If your case is strong and you're not in a rush, standard is fine.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Step 4: Assembly ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-navy border-b border-gray-100 pb-2">Step 4, Assemble and Mail the Package</h2>

        <div className="card !p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-navy mb-2">Packet assembly order (top to bottom)</p>
            <div className="space-y-1.5">
              {[
                { n: '1', text: 'Cover letter (listing all exhibits)' },
                { n: '2', text: 'Form I-140 (completed and signed)' },
                { n: '3', text: 'Filing fee check or Form G-1450' },
                { n: '4', text: 'Personal statement (your attorney brief)' },
                { n: '5', text: 'Recommendation letters (signed originals)' },
                { n: '6', text: 'Exhibits A, B, C… in labeled tabs' },
                { n: '7', text: 'Copy of your current visa and I-94' },
                { n: '8', text: 'Copy of passport biographic page' },
              ].map(item => (
                <div key={item.n} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">{item.n}</div>
                  <p className="text-xs text-navy mt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-navy mb-2">Mailing address</p>
            <p className="text-xs text-mid leading-relaxed mb-2">
              USCIS mailing addresses change. Always verify at{' '}
              <a href="https://www.uscis.gov/i-140" target="_blank" rel="noreferrer" className="text-teal hover:underline">
                uscis.gov/i-140
              </a>{' '}
              before mailing. The correct address depends on whether you&apos;re using premium processing and your service center.
            </p>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 font-mono text-xs text-navy">
              <p className="font-bold mb-1">USPS (regular filing, no premium processing):</p>
              <p>USCIS</p>
              <p>PO Box 660128</p>
              <p>Dallas, TX 75266</p>
              <p className="mt-2 font-bold">FedEx / UPS / DHL:</p>
              <p>USCIS Attn: I-140</p>
              <p>2501 S State Hwy 121 Business</p>
              <p>Suite 400, Lewisville, TX 75067</p>
              <p className="mt-2 text-orange-700 font-sans font-semibold not-italic">⚠️ Verify at uscis.gov before mailing, addresses change</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-navy mb-1.5">Shipping tips</p>
            <div className="space-y-1">
              {[
                'Use USPS Priority Mail with tracking, or FedEx/UPS with tracking',
                'Make a complete copy of every page before mailing',
                'Request a Return Receipt (USPS Form 3800) for proof of delivery',
                'Keep tracking information until you receive your receipt notice (Form I-797)',
              ].map((tip, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-teal text-xs">·</span>
                  <p className="text-xs text-mid">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Step 5: After filing ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-navy border-b border-gray-100 pb-2">Step 5, After You File</h2>

        <div className="card !p-4 space-y-3">
          <div className="space-y-3">
            {[
              {
                title: 'Receipt notice (Form I-797)',
                timing: '2-4 weeks after mailing',
                description: 'USCIS sends a receipt notice confirming they received your petition. It includes a receipt number (WAC, LIN, EAC, or SRC), use this to check status at egov.uscis.gov.',
              },
              {
                title: 'Request for Evidence (RFE)',
                timing: 'If issued: typically 3-6 months after filing',
                description: 'USCIS may send an RFE asking for additional evidence. You usually have 87 days to respond. A strong initial petition reduces RFE risk significantly.',
              },
              {
                title: 'Approval or denial',
                timing: 'Standard: 6-12 months · Premium: 15 calendar days (EB-1A) / 45 (NIW)',
                description: 'If approved, you receive a Form I-797 approval notice. The I-140 approval locks in your priority date. If denied, you have options to appeal or refile.',
              },
            ].map(step => (
              <div key={step.title} className="rounded-xl border border-gray-100 p-4 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-navy">{step.title}</p>
                  <span className="text-[10px] text-mid bg-gray-50 border border-gray-200 rounded px-2 py-0.5 flex-shrink-0">{step.timing}</span>
                </div>
                <p className="text-xs text-mid leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-teal/6 border border-teal/20 p-4">
            <p className="text-xs font-bold text-navy mb-1">Got an RFE?</p>
            <p className="text-xs text-mid leading-relaxed mb-2">
              F-1 Careers has an RFE Response Builder that helps you structure a strong response. RFEs are common, they are not denials.
            </p>
            <Link href="/rfe" className="text-xs text-teal font-semibold hover:underline">
              Open RFE Response Builder →
            </Link>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-navy border-b border-gray-100 pb-2">Official Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'USCIS I-140 page', url: 'https://www.uscis.gov/i-140', desc: 'Official form, instructions, mailing addresses' },
            { label: 'USCIS case status', url: 'https://egov.uscis.gov', desc: 'Check your receipt number status online' },
            { label: 'Visa Bulletin', url: 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html', desc: 'Priority date cutoffs, check monthly' },
            { label: 'USCIS processing times', url: 'https://egov.uscis.gov/processing-times/', desc: 'Current estimated wait times by form type' },
          ].map(r => (
            <a
              key={r.label}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="card !p-4 hover:border-teal transition-colors group"
            >
              <p className="text-xs font-semibold text-navy group-hover:text-teal transition-colors">{r.label} ↗</p>
              <p className="text-[11px] text-mid mt-0.5">{r.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* CTA back */}
      <div className="flex items-center gap-4 pt-2">
        <Link href="/petition-builder" className="btn-primary">
          ← Back to Petition Builder
        </Link>
        <p className="text-xs text-mid">This guide is for informational purposes only and does not constitute legal advice.</p>
      </div>

    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormCard({
  name,
  fullName,
  description,
  url,
  fee,
  optional,
  notes,
}: {
  name: string
  fullName: string
  description: string
  url: string
  fee: string
  optional?: boolean
  notes: string[]
}) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-navy">{name}</p>
              {optional && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-mid">Optional</span>
              )}
            </div>
            <p className="text-xs text-mid mt-0.5">{fullName}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-navy">{fee}</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-teal hover:underline"
            >
              Download form ↗
            </a>
          </div>
        </div>
        <p className="text-xs text-mid mt-2 leading-relaxed">{description}</p>
      </div>
      <div className="px-5 py-3 bg-gray-50 space-y-1">
        {notes.map((note, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-teal text-xs flex-shrink-0 mt-0.5">·</span>
            <p className="text-xs text-mid">{note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Exhibit definitions ───────────────────────────────────────────────────────

const NIW_EXHIBITS = [
  { label: 'Personal Statement', description: 'Your attorney brief arguing all three Dhanasar prongs. This is the narrative you generated in the Petition Builder.', prong: 'All prongs' },
  { label: 'Curriculum Vitae', description: 'Complete CV including all publications, presentations, grants, and professional achievements.', prong: 'Prong 2 support' },
  { label: 'Publication list with citation counts', description: 'List of all peer-reviewed publications with citation counts pulled from Google Scholar or Web of Science.', prong: 'Prong 2, Well-positioned' },
  { label: 'Copies of top publications', description: 'Full text of 3-5 most significant published works. Include the full paper, not just abstract.', prong: 'Prong 1 & 2' },
  { label: 'Evidence of citations', description: 'Screenshots or printouts showing papers citing your work. Include the citing paper title and author.', prong: 'Prong 2' },
  { label: 'Peer review invitation letters', description: 'Any emails or letters from journals/conferences inviting you to review manuscripts.', prong: 'Prong 2, Field recognition' },
  { label: 'National priority documentation', description: 'Government reports, agency priorities, Congressional findings, or grant announcements establishing that your field is a national priority.', prong: 'Prong 1, National importance' },
  { label: 'Recommendation letters', description: 'Signed original letters from 3-5 experts. Majority should be independent (no prior working relationship). Stack independent letters first.', prong: 'Prong 2 & 3' },
  { label: 'Degree and transcript', description: 'Copy of advanced degree (PhD, MD, or equivalent). Include official or unofficial transcript.', prong: 'Background' },
  { label: 'Awards and recognition', description: 'Certificates, announcements, or documentation of competitive awards, grants, or honors.', prong: 'Prong 2' },
  { label: 'Current visa and I-94', description: 'Copy of current visa stamp and I-94 record (available at i94.cbp.dhs.gov).', prong: 'Status documentation' },
]

const EB1A_EXHIBITS = [
  { label: 'Personal Statement', description: 'Your attorney brief addressing each EB-1A criterion satisfied and arguing the final merits determination.', prong: 'All criteria' },
  { label: 'Curriculum Vitae', description: 'Complete CV. For EB-1A, include all award nominations, judging roles, media mentions, and salary data.', prong: 'Overview' },
  { label: 'Awards and prizes documentation', description: 'Official announcement, certificate, or correspondence confirming nationally/internationally recognized award. Include the competition scope.', prong: 'Criterion (i)' },
  { label: 'Association membership evidence', description: 'Documentation that membership required outstanding achievement, include the association\'s bylaws or selection criteria.', prong: 'Criterion (ii)' },
  { label: 'Published media coverage', description: 'Full print of articles about you in major publications or professional journals. Include publication name, date, circulation.', prong: 'Criterion (iii)' },
  { label: 'Peer review evidence', description: 'Invitations to review manuscripts; conference program committees; editorial board memberships.', prong: 'Criterion (iv)' },
  { label: 'Original contribution evidence', description: 'Papers, patents, or technical reports documenting original contributions. Include citation data and commentary from others in the field.', prong: 'Criterion (v)' },
  { label: 'Scholarly articles', description: 'Copies of published peer-reviewed papers. Include citation counts.', prong: 'Criterion (vi)' },
  { label: 'Critical role documentation', description: 'Org charts, employer letters, or board resolutions confirming leadership or critical role at a distinguished organization.', prong: 'Criterion (viii)' },
  { label: 'Salary evidence', description: 'Pay stubs, offer letters, or salary surveys showing high compensation relative to peers in the field.', prong: 'Criterion (ix)' },
  { label: 'Recommendation letters', description: '6-9 letters from independent experts and collaborators. Each letter should address specific criteria with concrete examples.', prong: 'All criteria support' },
  { label: 'Degree and transcript', description: 'Copy of advanced degree. Include official or unofficial transcript.', prong: 'Background' },
  { label: 'Current visa and I-94', description: 'Copy of current visa stamp and I-94 record.', prong: 'Status documentation' },
]
