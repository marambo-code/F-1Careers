// Server component — reads active admin alerts from Supabase
import { createClient } from '@/lib/supabase/server'

interface AdminAlert {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export default async function AdminAlertBanner() {
  try {
    const supabase = await createClient()
    const { data: alerts } = await supabase
      .from('admin_alerts')
      .select('id, title, message, severity')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (!alerts || alerts.length === 0) return null

    return (
      <div className="space-y-2">
        {(alerts as AdminAlert[]).map(alert => (
          <div
            key={alert.id}
            className={`rounded-xl px-4 py-3 border flex items-start gap-3 ${
              alert.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-900' :
              alert.severity === 'warning'  ? 'bg-yellow-50 border-yellow-200 text-yellow-900' :
                                              'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">
              {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <div>
              <p className="font-semibold text-sm">{alert.title}</p>
              <p className="text-sm mt-0.5 opacity-80">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    )
  } catch {
    return null
  }
}
