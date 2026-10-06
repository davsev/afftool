import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedMod, listPublishedSlugs, listRelated } from '@/lib/mods'
import { PreviewMedia } from '@/components/PreviewMedia'
import { SurfaceChips } from '@/components/SurfaceChips'
import { PromptBlock } from '@/components/PromptBlock'
import { ModGrid } from '@/components/ModGrid'
import { Avatar } from '@/components/Avatar'
import { LikeSlot } from './LikeSlot'

export const revalidate = 300
export const dynamicParams = true

export async function generateStaticParams() {
  return (await listPublishedSlugs()).map(slug => ({ slug }))
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const mod = await getPublishedMod((await params).slug)
  if (!mod) return {}
  return { title: mod.title, description: mod.tagline, openGraph: { title: mod.title, description: mod.tagline } }
}

const REACH_LABEL: Record<string, string> = {
  files: 'Reads/writes files',
  network: 'Uses the network',
  processes: 'Runs processes',
  model: 'Calls a model',
  none: 'No outside access',
}

export default async function ModPage({ params }: { params: Params }) {
  const mod = await getPublishedMod((await params).slug)
  if (!mod) notFound()
  const related = await listRelated(mod)

  return (
    <article className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <Link href="/mods" className="text-sm text-muted hover:text-fg">← All mods</Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-line">
          <PreviewMedia mod={mod} large />
        </div>
        <div className="flex flex-col">
          {mod.category && (
            <Link href={`/mods?category=${mod.category.slug}`} className="font-mono text-xs uppercase tracking-wider text-accent">
              {mod.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">{mod.title}</h1>
          <p className="mt-4 text-lg text-muted">{mod.tagline}</p>
          <Link href={`/u/${mod.author.handle}`} className="mt-5 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <Avatar url={mod.author.avatarUrl} name={mod.author.displayName ?? mod.author.handle} size={22} />
            {mod.author.displayName ?? mod.author.handle}
          </Link>
          <div className="mt-6 space-y-3">
            <SurfaceChips surfaces={mod.surfaces} size="md" />
            <ul className="flex flex-wrap gap-1.5">
              {mod.reaches.map(r => (
                <li
                  key={r}
                  className={`rounded-full px-3 py-1 text-xs ${r === 'none' ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}
                >
                  {REACH_LABEL[r]}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LikeSlot modId={mod.id} count={mod.likeCount} />
            <span className="font-mono text-xs text-muted">{mod.copyCount.toLocaleString('en-US')} copies</span>
            {mod.minCcVersion && <span className="font-mono text-xs text-muted">· Claude Code {mod.minCcVersion}+</span>}
          </div>
          {mod.descriptionMd && <p className="mt-6 whitespace-pre-line leading-relaxed text-fg/85">{mod.descriptionMd}</p>}
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <section>
          <h2 className="mb-4 font-display text-3xl tracking-tight">The prompt</h2>
          <PromptBlock modId={mod.id} slug={mod.slug} prompt={mod.promptMd} />
        </section>
        <aside className="space-y-5 lg:pt-14">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-medium">How to use it</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
              <li>Open Claude Code 2.1.287 or later in any folder.</li>
              <li>Paste the prompt. Change anything you want first: colors, names, limits.</li>
              <li>Claude builds the mod and loads it with <code className="font-mono text-fg">/reload-plugins</code>.</li>
            </ol>
            <Link href="/guide" className="mt-4 inline-block text-sm text-accent hover:underline">Full guide →</Link>
          </div>
          <div className="rounded-2xl border border-warn/30 bg-warn/5 p-5 text-sm">
            <h3 className="font-medium text-warn">Read before you keep it</h3>
            <p className="mt-2 text-muted">
              A mod runs with your permissions. Read the code Claude writes, then run{' '}
              <code className="font-mono text-fg">claude plugin validate ./{mod.slug}</code> to list what it hooks and calls.
            </p>
          </div>
          {(mod.installCmd || mod.repoUrl) && (
            <div className="rounded-2xl border border-line bg-surface p-5 text-sm">
              <h3 className="font-medium">Prefer the author&apos;s version?</h3>
              {mod.installCmd && (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs">{mod.installCmd}</pre>
              )}
              {mod.repoUrl && (
                <a href={mod.repoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-accent hover:underline">
                  View source →
                </a>
              )}
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-3xl tracking-tight">More like this</h2>
          <ModGrid mods={related} />
        </section>
      )}
    </article>
  )
}
