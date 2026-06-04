import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Stateful entry point for the green-card funnel. Routes each visitor to the
// right step so the journey is resumable from any entry point (homepage CTA,
// a "continue" link, etc.) instead of always restarting at step one.
export default async function StartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const [{ data: profile }, { data: reports }] = await Promise.all([
    supabase.from('profiles').select('full_name, visa_status, field_of_study').eq('id', user.id).single(),
    supabase.from('reports')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('type', 'strategy')
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  // Already started a report → resume at the preview, or the finished report.
  const latest = reports?.[0]
  if (latest) {
    redirect(latest.status === 'complete'
      ? `/strategy/report/${latest.id}`
      : `/strategy/preview?reportId=${latest.id}`)
  }

  // No report yet: finish the profile first, otherwise go straight to the questionnaire.
  const profileComplete = !!(profile?.full_name && profile?.visa_status && profile?.field_of_study)
  redirect(profileComplete ? '/strategy/questionnaire' : '/profile?welcome=true')
}
