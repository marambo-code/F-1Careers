import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// Admin-only configuration healthcheck. Reports ONLY whether each environment
// variable is present (boolean) — it never reads or displays the secret values.
// Useful to catch silent failures, e.g. a missing POSTMARK_SERVER_TOKEN makes
// report-ready emails skip sending with no error.

type Check = { key: string; label: string; required: boolean }

const GROUPS: { title: string; note?: string; checks: Check[] }[] = [
  {
    title: 'Email delivery (Postmark)',
    note: 'If the token is missing, report-ready and attorney-notify emails silently skip.',
    checks: [
      { key: 'POSTMARK_SERVER_TOKEN', label: 'Postmark server token', required: true },
      { key: 'FROM_EMAIL', label: 'From address', required: false },
      { key: 'ATTORNEY_NOTIFY_EMAIL', label: 'Attorney-notify recipient', required: false },
    ],
  },
  {
    title: 'Payments (Stripe)',
    checks: [
      { key: 'STRIPE_SECRET_KEY', label: 'Secret key', required: true },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook secret (one-time)', required: true },
      { key: 'STRIPE_SUBSCRIPTION_WEBHOOK_SECRET', label: 'Webhook secret (subscription)', required: true },
      { key: 'STRIPE_STRATEGY_PRICE_ID', label: 'Strategy report price ID', required: true },
      { key: 'STRIPE_RFE_PRICE_ID', label: 'RFE price ID', required: true },
      { key: 'STRIPE_SUBSCRIPTION_PRICE_ID', label: 'Pro monthly price ID', required: true },
      { key: 'STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID', label: 'Pro annual price ID', required: true },
    ],
  },
  {
    title: 'Database & auth (Supabase)',
    checks: [
      { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Project URL', required: true },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Anon key', required: true },
      { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service-role key', required: true },
    ],
  },
  {
    title: 'AI & app',
    checks: [
      { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API key (report generation)', required: true },
      { key: 'NEXT_PUBLIC_APP_URL', label: 'Public app URL', required: true },
      { key: 'ADMIN_EMAILS', label: 'Admin allowlist override', required: false },
    ],
  },
]

export default async function HealthAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdminEmail(user.email)) notFound()

  const present = (k: string) => !!(process.env[k] && process.env[k]!.trim().length > 0)
  const missingRequired = GROUPS.flatMap(g => g.checks).filter(c => c.required && !present(c.key))

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-navy">Configuration health</h1>
        <p className="text-sm text-mid mt-1">
          Whether each environment variable is set in this deployment. Values are never shown.
        </p>
      </div>

      {missingRequired.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-bold">{missingRequired.length} required {missingRequired.length === 1 ? 'key is' : 'keys are'} missing.</span>{' '}
          {missingRequired.map(c => c.key).join(', ')}
        </div>
      ) : (
        <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal-700">
          <span className="font-bold">All required keys are set.</span>
        </div>
      )}

      {GROUPS.map(group => (
        <div key={group.title} className="card !p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-black text-navy uppercase tracking-widest">{group.title}</h2>
            {group.note && <p className="text-xs text-mid mt-1">{group.note}</p>}
          </div>
          <div className="divide-y divide-gray-100">
            {group.checks.map(c => {
              const ok = present(c.key)
              return (
                <div key={c.key} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">{c.label}</p>
                    <p className="text-[11px] text-mid font-mono truncate">{c.key}</p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                    ok ? 'text-teal-700 bg-teal/10 border-teal/30'
                       : c.required ? 'text-red-700 bg-red-50 border-red-200'
                                    : 'text-mid bg-gray-50 border-gray-200'
                  }`}>
                    {ok ? 'Set' : c.required ? 'Missing' : 'Not set'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-mid">
        Set or update these in Vercel → Project → Settings → Environment Variables, then redeploy.
      </p>
    </div>
  )
}
