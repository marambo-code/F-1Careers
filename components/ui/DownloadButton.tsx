'use client'

interface DownloadButtonProps {
  reportId: string
  reportType: 'strategy' | 'rfe'
  className?: string
}

export default function DownloadButton({ reportId, reportType, className = '' }: DownloadButtonProps) {
  const handleDownload = () => {
    // Opens clean print page in new tab — browser print dialog lets them save as PDF
    const url = `/print/${reportType}/${reportId}`
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleDownload}
      className={`btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download PDF
    </button>
  )
}
