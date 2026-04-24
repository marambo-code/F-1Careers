import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
      <div className="max-w-2xl">
        <div className="card !p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-navy to-navy/60" />
          <div className="p-8 space-y-5 text-center">
            <div className="text-4xl">🗺️</div>
            <div>
              <h1 className="text-2xl font-bold text-navy">Petition Builder</h1>
              <p className="text-mid mt-2 leading-relaxed max-w-md mx-auto">
                A structured 12–24 month roadmap from your current profile to a filing-ready EB-1A or NIW petition. Evidence tracking, narrative review, and live filing climate signals.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-left">
              {[
                { icon: '📋', title: 'Evidence Track', desc: 'Criterion-by-criterion checklist with runway countdown' },
                { icon: '✍️', title: 'Narrative Review', desc: 'AI reviews your proposed endeavor like a USCIS adjudicator' },
                { icon: '📡', title: 'Filing Signal', desc: 'Live approval rates by field, pathway, and service center' },
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
                Upgrade to Pro — $29/mo
              </Link>
              <p className="text-xs text-mid mt-3">Includes Petition Builder, Career Moves, RFE Analyzer, and unlimited strategy reports.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <PetitionBuilderClient />
}
