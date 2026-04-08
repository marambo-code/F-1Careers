'use client'

interface PrintButtonProps {
  className?: string
  label?: string
}

export default function PrintButton({ className, label = 'Download PDF' }: PrintButtonProps) {
  return (
    <button onClick={() => window.print()} className={className}>
      {label}
    </button>
  )
}
