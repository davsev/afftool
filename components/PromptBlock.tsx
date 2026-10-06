'use client'
import { trackCopy } from '@/lib/actions'
import { CopyButton } from './CopyButton'

export function PromptBlock({ modId, slug, prompt }: { modId: string; slug: string; prompt: string }) {
  return (
    <div className="overflow-clip rounded-2xl border border-line bg-[#0d0d0f]">
      <div className="sticky top-14 z-10 flex items-center gap-2 border-b border-line bg-[#0d0d0f]/95 px-4 py-2.5 backdrop-blur">
        <span className="font-mono text-xs text-muted">prompt.md</span>
        <div className="ml-auto flex gap-2">
          <a
            href={`/mods/${slug}/prompt.md`}
            download
            className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted hover:border-fg/40 hover:text-fg"
          >
            Download .md
          </a>
          <CopyButton
            text={prompt}
            onCopied={() => void trackCopy(modId, 'copy')}
            className="bg-accent px-3.5 py-1.5 text-sm font-medium text-bg hover:bg-[#ff7f59]"
          />
        </div>
      </div>
      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-[13px] leading-relaxed text-fg/90">
        {prompt}
      </pre>
    </div>
  )
}
