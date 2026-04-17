import { getCountryBacklog, getExecutiveAlertsForCountry, BULLETIN_LAST_UPDATED } from '@/lib/data/visa-bulletin'
import Link from 'next/link'

interface CountryAlertProps {
  countryCode: string | null
  recommendedPathway: string | null
}

export default function CountryAlert({ countryCode, recommendedPathway }: CountryAlertProps) {
  if (!countryCode) return null

  const backlog = getCountryBacklog(countryCode)
  const execAlerts = getExecutiveAlertsForCountry(countryCode)

  if (!backlog && execAlerts.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Executive order / policy alerts */}
      {execAlerts.map(alert => (
        <div
          key={alert.id}
          className={`rounded-xl px-4 py-3 border flex items-start gap-3 ${
            alert.severity === 'critical'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-yellow-50 border-yellow-200 text-yellow-900'
          }`}
        >
          <span className="text-lg flex-shrink-0 mt-0.5">{alert.severity === 'critical' ? '🚨' : '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{alert.title}</p>
            <p className="text-sm mt-0.5 opacity-80">{alert.message}</p>
            <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 inline-block opacity-70 hover:opacity-100">
              USCIS source →
            </a>
          </div>
        </div>
      ))}

      {/* Priority date backlog */}
      {backlog && backlog.severity !== 'current' && (
        <div className={`rounded-xl border px-4 py-3 ${
          backlog.severity === 'critical' ? 'bg-red-50 border-red-200' :
          backlog.severity === 'severe'   ? 'bg-orange-50 border-orange-200' :
          backlog.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                                            'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{backlog.flag}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-semibold text-sm ${
                  backlog.severity === 'critical' ? 'text-red-800' :
                  backlog.severity === 'severe'   ? 'text-orange-800' :
                  backlog.severity === 'moderate' ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {backlog.headline}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">
                  Visa Bulletin · {BULLETIN_LAST_UPDATED}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                backlog.severity === 'critical' ? 'text-red-700' :
                backlog.severity === 'severe'   ? 'text-orange-700' :
                backlog.severity === 'moderate' ? 'text-yellow-700' : 'text-blue-700'
              }`}>
                {backlog.recommendation}
              </p>

              {/* Priority date mini table */}
              <div className="flex gap-4 mt-2 flex-wrap">
                {[
                  { label: 'EB-1A', data: backlog.eb1 },
                  { label: 'EB-2 NIW', data: backlog.eb2 },
                ].map(({ label, data }) => (
                  <div key={label} className="text-xs">
                    <span className="font-bold opacity-60">{label}: </span>
                    <span className={`font-semibold ${data.date === 'Current' ? 'text-teal' : 'text-inherit opacity-80'}`}>
                      {data.date === 'Current' ? '✓ Current' : `${data.date} (~${data.waitYears}yr wait)`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
            <p className="text-xs opacity-50">Priority dates change monthly. Verify at travel.state.gov</p>
            <a
              href="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity"
            >
              Current bulletin →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
