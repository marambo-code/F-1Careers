'use client'

import { useState } from 'react'

interface PayButtonProps {
  reportId: string
  productType: 'strategy' | 'rfe'
  className?: string
}

const PRICES = {
  strategy: '$297',
  rfe: '$297',
}

export default function PayButton({ reportId, productType, className }: PayButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, productType }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  return (
    <>
      <button onClick={handlePay} disabled={loading} className={className}>
        {loading ? 'Redirecting to payment...' : `Unlock full report, ${PRICES[productType]}`}
      </button>
      {/* Immediate-performance / non-refundable acknowledgment, adjacent to the purchase action. */}
      <p className="mt-2 text-[11px] leading-relaxed text-blue-300 text-center">
        By purchasing, you ask us to generate your report immediately and agree it is non-refundable once it has been generated. See our{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Terms</a>.
      </p>
    </>
  )
}
