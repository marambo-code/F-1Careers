'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }

    setDeleting(true)
    await fetch(`/api/reports/delete?id=${reportId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      className={`text-xs px-2 py-1 rounded transition-colors flex-shrink-0 ${
        confirming
          ? 'bg-red-600 text-white font-semibold'
          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
      }`}
      disabled={deleting}
      title="Delete report"
    >
      {deleting ? '…' : confirming ? 'Confirm delete' : '✕'}
    </button>
  )
}
