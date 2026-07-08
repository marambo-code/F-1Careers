import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPetitionBuilderPrecedent } from '@/lib/precedent/queries'
import PetitionBuilderClient from './PetitionBuilderClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PetitionBuilderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check Pro status server-side
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()

  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing'

  if (!isPro) {
    return (
      <div className="max-w-3xl">
        <div className="card !p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-navy to-navy/60" />
          <div className="p-8 space-y-5 text-center">
            <div className="text-4xl">⚖️</div>
            <div>
              <h1 className="text-2xl font-bold text-navy">Petition Builder</h1>
              <p className="text-mid mt-2 leading-relaxed max-w-md mx-auto">
                A working environment for your EB-1A or NIW self-petition: evidence tracking measured against real AAO
                decisions, adversarial narrative review, recommender briefings, and draft petition documents.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-left">
              {[
                { icon: '📋', title: 'Evidence, benchmarked', desc: 'Each criterion shows what thousands of real AAO decisions accepted, not just a checkbox' },
                { icon: '✍️', title: 'Adversarial review', desc: 'Your proposed endeavor reviewed the way a skeptical adjudicator would read it' },
                { icon: '📄', title: 'Working drafts', desc: 'Recommender briefings plus draft personal statement and cover letter you refine and own' },
              ].map(f => (
                <div key={f.title} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="text-xl mb-2">{f.icon}</div>
                  <p className="text-xs font-bold text-navy">{f.title}</p>
                  <p className="text-xs text-mid mt-1 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link href="/subscribe" className="btn-primary inline-flex items-center gap-2">
                Upgrade to Pro →
              </Link>
              <p className="text-xs text-mid mt-3">$49/mo or $399/yr. Includes Petition Builder, Career Moves, and the living Green Card Score. Strategy and RFE reports purchased separately.</p>
              <p className="text-xs text-mid mt-2">Evidence-based guidance, not legal advice and never a guarantee of approval.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Real AAO adjudication patterns for the Evidence and Precedent tabs.
  // Null on any failure; the client degrades gracefully.
  const precedent = await getPetitionBuilderPrecedent()

  return <PetitionBuilderClient precedent={precedent} />
}
