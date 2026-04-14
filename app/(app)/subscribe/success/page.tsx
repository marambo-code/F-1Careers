import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SubscribeSuccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 pt-8">
      <div className="w-16 h-16 rounded-full bg-teal/15 flex items-center justify-center mx-auto">
        <span className="text-teal text-3xl">✓</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-navy">You're a Pro member</h1>
        <p className="text-mid mt-2">
          Your Green Card Score is now live. As you complete new strategy reports and execute career moves, your score will update automatically.
        </p>
      </div>
      <div className="card text-left space-y-2">
        <p className="font-semibold text-navy text-sm">What's unlocked for you:</p>
        {[
          'Living Green Card Score — updates with every report',
          'All 4 AI career moves, personalized to your exact profile',
          'Score history chart — track your trajectory',
          'Priority support',
        ].map(item => (
          <div key={item} className="flex items-center gap-2 text-sm text-mid">
            <span className="text-teal font-bold">✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <Link
        href="/dashboard"
        className="btn-primary inline-block w-full text-center"
      >
        Go to your dashboard →
      </Link>
      <p className="text-xs text-mid">
        It may take a few seconds for your Pro status to appear.
        <br />Refresh your dashboard if you don't see it right away.
      </p>
    </div>
  )
}
