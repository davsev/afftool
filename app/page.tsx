import Link from 'next/link'
import { listFeatured, listMods } from '@/lib/mods'
import { ModGrid } from '@/components/ModGrid'
import { TerminalMock } from '@/components/TerminalMock'
import { SEED_MODS } from '@/content/seed-mods'

export const revalidate = 300

export default async function Home() {
  const [featured, latest] = await Promise.all([listFeatured(), listMods({})])
  const hero = SEED_MODS.find(m => m.slug === 'blast-shield') ?? SEED_MODS[0]

  return (
    <>
      <section className="glow grain relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-xs text-muted">
              <span className="size-1.5 rounded-full bg-ok" /> {latest.total} mods · free prompts
            </p>
            <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              Prompts that build <em className="text-accent">Claude Code</em> mods.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Panes, bands, status lines and guards made by the community. Find one you like, copy its prompt,
              paste it into Claude Code, and get your own version in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/mods" className="rounded-full bg-fg px-6 py-3 font-medium text-bg hover:bg-white">
                Browse mods
              </Link>
              <Link href="/submit" className="rounded-full border border-line px-6 py-3 hover:border-fg/40">
                Share your mod
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-accent/10 blur-3xl" aria-hidden />
            <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-line shadow-2xl shadow-black/60">
              <TerminalMock lines={hero.mock!.lines} surfaces={hero.surfaces} accent={hero.mock!.accent} large />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[
            ['01', 'Pick a mod', 'Browse by where it shows: pane, band, status line, guard.'],
            ['02', 'Copy the prompt', 'Every mod comes with a full build prompt. No repo needed.'],
            ['03', 'Paste in Claude Code', 'Claude writes the mod with the plugin-authoring skill. Tweak it to taste.'],
          ].map(([n, t, d]) => (
            <li key={n} className="bg-surface p-6">
              <span className="font-mono text-xs text-accent">{n}</span>
              <h2 className="mt-2 font-medium">{t}</h2>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
          <h2 className="mb-6 font-display text-3xl tracking-tight sm:text-4xl">Featured</h2>
          <ModGrid mods={featured.slice(0, 3)} />
        </section>
      )}

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Latest mods</h2>
          <Link href="/mods" className="text-sm text-muted hover:text-fg">View all →</Link>
        </div>
        <ModGrid mods={latest.items.slice(0, 9)} />
      </section>
    </>
  )
}
