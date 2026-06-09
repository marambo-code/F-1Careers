import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function AttorneyRequestsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdminEmail(user.email)) notFound()

  const service = createServiceClient()
  const { data: requests } = await service
    .from('attorney_review_requests')
    .select('*')
    .order('created_at', { ascending: false })

  // Map user_id -> email
  const emailById = new Map<string, string>()
  try {
    const { data: usersList } = await service.auth.admin.listUsers()
    for (const u of usersList?.users ?? []) emailById.set(u.id, u.email ?? '')
  } catch { /* admin API not available; fall back to user_id */ }

  const rows = requests ?? []

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-navy">Attorney review requests</h1>
        <p className="text-sm text-mid mt-1">{rows.length} total. Newest first. This is your demand signal.</p>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-mid">No requests yet.</div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-light text-left text-xs uppercase tracking-wide text-mid">
                <th className="px-4 py-3 font-bold">When</th>
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Consent</th>
                <th className="px-4 py-3 font-bold">Note</th>
                <th className="px-4 py-3 font-bold">Report</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 text-mid whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-navy font-medium">{emailById.get(r.user_id) || r.user_id}</td>
                  <td className="px-4 py-3 uppercase text-xs font-bold text-teal">{r.report_type}</td>
                  <td className="px-4 py-3">{r.consent_share ? '✓ shares report' : '— no'}</td>
                  <td className="px-4 py-3 text-mid max-w-xs">{r.note || '—'}</td>
                  <td className="px-4 py-3">
                    {r.report_id ? (
                      <Link href={`/${r.report_type}/report/${r.report_id}`} className="text-teal hover:underline">open</Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
