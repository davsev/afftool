'use client'
import { useState } from 'react'

type Props = {
  text: string
  label?: string
  onCopied?: () => void
  className?: string
  compact?: boolean
}

export function CopyButton({ text, label = 'Copy prompt', onCopied, className = '', compact }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    onCopied?.()
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={compact ? label : undefined}
      className={`inline-flex items-center gap-2 rounded-full transition-colors ${className}`}
    >
      <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {copied ? (
          <path d="M5 12l5 5L20 7" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
      {compact ? <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span> : <span aria-live="polite">{copied ? 'Copied' : label}</span>}
    </button>
  )
}
