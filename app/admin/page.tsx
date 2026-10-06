import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MOD_SELECT, rowToMod } from '@/lib/mods'
import { createSessionClient } from '@/lib/supabase/server'
import { moderateMod } from '@/lib/actions'
import { PreviewMedia } from '@/components/PreviewMedia'
import { SurfaceChips } from '@/components/SurfaceChips'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Moderation', robots: { index: false } }

const CHECKS = [
  'No data exfiltration (sending files, env or prompts anywhere)',
  'Does not disable or auto-approve permission prompts without saying so',
  'No hidden behavior; the prompt matches the description',
  'Declared "reaches" match what the prompt asks for',
  'Preview matches the prompt',
]

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (user?.role !== 'admin') notFound()
  const sb = await createSessionClient()
  const { data } = await sb.from('mods').select(MOD_SELECT).eq('status', 'pending').order('created_at')
  const queue = (data ?? []).map(rowToMod)
  const { data: liveData } = await sb
    .from('mods').select('id, slug, title, is_featured').eq('status', 'published').order('published_at', { ascending: false }).limit(50)

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-4xl tracking-tight">Moderation · {queue.length} pending</h1>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
        {CHECKS.map(c => <li key={c}>{c}</li>)}
      </ul>

      <div className="mt-10 space-y-10">
        {queue.map(m => (
          <section key={m.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="grid gap-5 md:grid-cols-[280px_1fr]">
              <div className="aspect-[16/10] overflow-hidden rounded-xl border border-line">
                <PreviewMedia mod={m} />
              </div>
              <div>
                <h2 className="text-xl font-medium">{m.title}</h2>
                <p className="text-sm text-muted">{m.tagline}</p>
                <p className="mt-2 text-xs text-muted">by @{m.author.handle} · {m.category?.name} · reaches: {m.reaches.join(', ')}</p>
                <div className="mt-3"><SurfaceChips surfaces={m.surfaces} /></div>
                {m.repoUrl && <a href={m.repoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent">{m.repoUrl}</a>}
              </div>
            </div>
            <pre className="mt-5 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-bg p-4 font-mono text-xs">{m.promptMd}</pre>
            <form action={moderateMod} className="mt-4 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={m.id} />
              <input name="note" placeholder="Note (required to reject)" className="min-w-60 flex-1 rounded-full border border-line bg-bg px-4 py-2 text-sm" />
              <button name="action" value="reject" className="rounded-full border border-bad/50 px-4 py-2 text-sm text-bad">Reject</button>
              <button name="action" value="approve" className="rounded-full bg-ok px-4 py-2 text-sm font-medium text-bg">Approve</button>
            </form>
          </section>
        ))}
        {queue.length === 0 && <p className="text-muted">Queue is empty.</p>}
      </div>

      <h2 className="mb-4 mt-16 font-display text-3xl">Published</h2>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {(liveData ?? []).map(m => (
          <li key={m.id} className="flex items-center gap-3 p-3 text-sm">
            <span className="flex-1">{m.title}</span>
            <form action={moderateMod}>
              <input type="hidden" name="id" value={m.id} />
              <button name="action" value={m.is_featured ? 'unfeature' : 'feature'} className="rounded-full border border-line px-3 py-1 text-xs">
                {m.is_featured ? '★ Featured' : '☆ Feature'}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
