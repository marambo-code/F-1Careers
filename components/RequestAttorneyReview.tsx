'use client'

import { useState } from 'react'

export default function RequestAttorneyReview({
  reportId,
  reportType,
}: {
  reportId: string
  reportType: 'strategy' | 'rfe'
}) {
  const [open, setOpen] = useState(false)
  const [consent, setConsent] = useState(true)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = async () => {
    setState('sending')
    try {
      const res = await fetch('/api/attorney-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, reportType, consent, note: note.trim() || undefined }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl border-2 border-teal bg-teal/5 p-5">
        <p className="text-base font-bold text-navy">Request received ✓</p>
        <p className="text-sm text-mid mt-1 leading-relaxed">
          We&apos;ll connect you with a vetted, independent immigration attorney to review your case. Watch your inbox.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-border p-5 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold text-navy">Ready to file? Get an attorney to review it.</p>
          <p className="text-sm text-mid mt-1 leading-relaxed max-w-lg">
            We&apos;ll connect you with a vetted immigration attorney who can review this {reportType === 'rfe' ? 'RFE response' : 'strategy'} and take it from here.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary text-sm whitespace-nowrap flex-shrink-0"
          >
            Request attorney review
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Anything you'd like the attorney to know? (optional)"
            rows={2}
            className="w-full rounded-xl border border-border p-3 text-sm text-navy focus:outline-none focus:border-teal"
          />
          <label className="flex items-start gap-2.5 text-sm text-mid cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 accent-teal"
            />
            <span>Share my report with the attorney so they can review my case.</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={state === 'sending'}
              className="btn-primary text-sm disabled:opacity-60"
            >
              {state === 'sending' ? 'Sending…' : 'Send request'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-mid hover:text-navy">
              Cancel
            </button>
          </div>
          {state === 'error' && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          )}
          <p className="text-[11px] text-mid leading-relaxed">
            F-1 Careers is not a law firm and does not provide legal advice. This connects you with an independent, licensed attorney; any engagement is between you and that attorney.
          </p>
        </div>
      )}
    </div>
  )
}
