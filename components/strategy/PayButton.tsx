'use client'

import { useState } from 'react'

interface PayButtonProps {
  reportId: string
  productType: 'strategy' | 'rfe'
  className?: string
}

const PRICES = {
  strategy: '$300',
  rfe: '$200',
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
    <button onClick={handlePay} disabled={loading} className={className}>
      {loading ? 'Redirecting to payment...' : `Unlock full report — ${PRICES[productType]}`}
    </button>
  )
}
