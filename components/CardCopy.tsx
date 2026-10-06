'use client'
import { trackCopy } from '@/lib/actions'
import { CopyButton } from './CopyButton'

export function CardCopy({ modId, prompt }: { modId: string; prompt: string }) {
  return (
    <CopyButton
      compact
      text={prompt}
      label="Copy prompt"
      onCopied={() => void trackCopy(modId, 'copy')}
      className="relative z-10 size-9 shrink-0 justify-center border border-line bg-raised text-muted hover:border-accent hover:text-accent"
    />
  )
}
