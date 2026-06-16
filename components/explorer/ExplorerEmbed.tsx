'use client'

import { useEffect, useRef } from 'react'

// Embeds the self-contained Green Card Explorer tool from /public/tools.
// The iframe auto-sizes to its content (no inner scrollbar) and the tool's
// optional email field is handed to us via postMessage so we can prefill
// signup. We never pass the email through the URL.
export default function ExplorerEmbed() {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== 'object') return
      if (d.type === 'explorerHeight' && ref.current && typeof d.height === 'number') {
        ref.current.style.height = d.height + 'px'
      }
      if (d.type === 'explorerLead' && typeof d.email === 'string') {
        try { sessionStorage.setItem('gc_prefill_email', d.email) } catch { /* ignore */ }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <iframe
      ref={ref}
      id="gcExplorer"
      src="/tools/green-card-explorer.html"
      title="Free Green Card Eligibility Explorer"
      loading="lazy"
      style={{ width: '100%', border: 0, display: 'block', height: 1200 }}
    />
  )
}
