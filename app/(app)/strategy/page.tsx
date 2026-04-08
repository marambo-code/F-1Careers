import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const DELIVERABLES = [
  {
    title: 'Career + Visa Pathway Assessment',
    description: 'Which pathways fit your trajectory (EB1A, EB-2 NIW, O-1, H-1B) — ranked by feasibility with rationale.',
  },
  {
    title: 'Criterion-Level Breakdown',
    description: 'Every USCIS criterion rated Strong / Developing / Gap based on your actual evidence.',
  },
  {
    title: 'Evidence Mapping',
    description: 'Exactly what you have, what it proves, and how strong it is in the eyes of USCIS.',
  },
  {
    title: 'Gap Analysis',
    description: 'What\'s missing, how material it is, and precisely what to do about it.',
  },
  {
    title: '3 / 6 / 12-Month Career Roadmap',
    description: 'Prioritized action plan tied specifically to your situation and goals.',
  },
  {
    title: 'Recommended Next Step',
    description: 'One clear, specific action — document collection, employer conversations, or attorney consultation.',
  },
]

export default async function StrategyStartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const hasResume = !!profile?.resume_path

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-teal uppercase tracking-widest">Career Strategy</span>
        <h1 className="text-2xl font-bold text-navy mt-1">Career Strategy Report</h1>
        <p className="text-mid mt-2 leading-relaxed">
          AI-powered analysis of your visa pathway, evidence strength, and a personalized
          roadmap — built specifically for international professionals navigating the US immigration system.
        </p>
      </div>

      {/* Deliverables */}
      <div className="card">
        <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
          <span className="w-5 h-5 bg-teal-light rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          What&apos;s in your report
        </h2>
        <div className="space-y-3">
          {DELIVERABLES.map(({ title, description }) => (
            <div key={title} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-teal flex-shrink-0 mt-2" />
              <div>
                <p className="text-sm font-semibold text-navy">{title}</p>
                <p className="text-sm text-mid leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resume warning */}
      {!hasResume && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Resume recommended</p>
            <p className="text-sm text-yellow-700 mt-0.5">Upload your resume in your profile for the most accurate AI analysis.</p>
            <Link href="/profile" className="text-sm font-semibold text-yellow-800 underline mt-1 inline-block">
              Upload resume →
            </Link>
          </div>
        </div>
      )}

      {/* Pricing CTA */}
      <div className="card bg-navy text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">One-time · No subscription</p>
            <p className="text-4xl font-bold mt-1">$300</p>
            <p className="text-blue-200 text-sm mt-1">Full structured report. Preview before you pay.</p>
          </div>
          <div className="text-right text-xs text-blue-300 space-y-1">
            <p>✓ Instant delivery</p>
            <p>✓ Downloadable PDF</p>
            <p>✓ Attorney-ready format</p>
          </div>
        </div>
        <Link
          href="/strategy/questionnaire"
          className="mt-6 w-full bg-teal text-white font-bold py-3 rounded-xl text-center block hover:bg-teal/90 transition-colors text-sm"
        >
          Start questionnaire — takes 5 minutes →
        </Link>
        <p className="text-xs text-blue-300 text-center mt-3">
          You&apos;ll preview your results for free before being asked to pay.
        </p>
      </div>
    </div>
  )
}
