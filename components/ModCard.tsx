import Link from 'next/link'
import type { Mod } from '@/lib/types'
import { PreviewMedia } from './PreviewMedia'
import { SurfaceChips } from './SurfaceChips'
import { CardCopy } from './CardCopy'

export function ModCard({ mod, index = 0 }: { mod: Mod; index?: number }) {
  return (
    <article
      data-card
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface opacity-0 transition-colors hover:border-fg/25"
      style={{ animation: `rise .6s cubic-bezier(.2,.7,.2,1) ${Math.min(index, 12) * 0.05}s forwards` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]">
          <PreviewMedia mod={mod} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium tracking-tight">
              <Link href={`/mods/${mod.slug}`} className="after:absolute after:inset-0">
                {mod.title}
              </Link>
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{mod.tagline}</p>
          </div>
          <CardCopy modId={mod.id} prompt={mod.promptMd} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <SurfaceChips surfaces={mod.surfaces} />
          <span className="shrink-0 font-mono text-[11px] text-muted">{mod.copyCount.toLocaleString('en-US')} copies</span>
        </div>
      </div>
    </article>
  )
}
