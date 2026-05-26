import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SubscribeClient from './SubscribeClient'

export default async function SubscribePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check for an existing subscription first
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (subscription) redirect('/career-moves')

  // Gate: require at least one strategy report before subscribing
  const { data: strategyReport } = await supabase
    .from('reports')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'strategy')
    .limit(1)
    .maybeSingle()

  if (!strategyReport) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <span className="text-xs font-bold text-teal uppercase tracking-widest">Pro Membership</span>
          <h1 className="text-2xl font-bold text-navy mt-1">Run your strategy report first</h1>
        </div>

        <div className="card border-2 border-teal/30 bg-teal/5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center flex-shrink-0 text-xl">📊</div>
            <div>
              <p className="font-bold text-navy">Your Pro membership is powered by your strategy report</p>
              <p className="text-sm text-mid mt-1.5 leading-relaxed">
                Pro keeps your Green Card Score current and unlocks career moves tailored to your profile. But your score and moves are anchored to your strategy report — that&apos;s where we assess your profile, score your EB-1A and NIW eligibility, and map exactly what you need to strengthen.
              </p>
              <p className="text-sm text-mid mt-2 leading-relaxed">
                Run your report first. Once you have your score, Pro gives you the tools to move it.
              </p>
            </div>
          </div>

          <div className="border-t border-teal/15 pt-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-navy">Green Card Strategy Report</p>
              <p className="text-xs text-mid mt-0.5">One-time · Preview free · Pay only if you want the full report</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-black text-navy">$497</p>
            </div>
          </div>

          <Link
            href="/strategy"
            className="block w-full text-center bg-teal text-white font-bold py-3 rounded-xl hover:bg-teal/90 transition-colors text-sm"
          >
            Run my strategy report →
          </Link>
        </div>

        <div className="card space-y-3">
          <p className="text-xs font-bold text-mid uppercase tracking-wide">What happens after your report</p>
          {[
            { step: '1', title: 'Get your Green Card Score', desc: 'Your EB-1A and NIW eligibility, scored across every criterion relevant to your profile.' },
            { step: '2', title: 'Come back here and subscribe', desc: 'Pro keeps your score updated as your career grows and unlocks all 4 career moves.' },
            { step: '3', title: 'Execute and watch your score climb', desc: 'Most Pro members see their score increase 5–15 points after completing 2–3 career moves.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">{item.title}</p>
                <p className="text-xs text-mid mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <SubscribeClient />
}
