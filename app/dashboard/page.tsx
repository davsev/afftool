import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MOD_SELECT, rowToMod } from '@/lib/mods'
import { createSessionClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions'
import { ModGrid } from '@/components/ModGrid'
import type { ModStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Dashboard' }

const BADGE: Record<ModStatus, string> = {
  draft: 'bg-fg/10 text-muted',
  pending: 'bg-warn/10 text-warn',
  published: 'bg-ok/10 text-ok',
  rejected: 'bg-bad/10 text-bad',
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard')
  const { submitted } = await searchParams
  const sb = await createSessionClient()
  const [{ data: own }, { data: liked }] = await Promise.all([
    sb.from('mods').select(MOD_SELECT).eq('author_id', user.id).order('created_at', { ascending: false }),
    sb.from('likes').select(`mods(${MOD_SELECT})`).eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  const mine = (own ?? []).map(rowToMod)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saved = (liked ?? []).map((r: any) => r.mods).filter(Boolean).map(rowToMod)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Your mods</h1>
          <p className="mt-2 text-muted">
            Public profile: <Link href={`/u/${user.handle}`} className="text-fg hover:underline">/u/{user.handle}</Link>
            {user.role === 'admin' && (
              <> · <Link href="/admin" className="text-accent hover:underline">Moderation queue</Link></>
            )}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <Link href="/submit" className="rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg">Submit a mod</Link>
          <form action={signOut}>
            <button className="rounded-full border border-line px-5 py-2 text-sm text-muted hover:text-fg">Sign out</button>
          </form>
        </div>
      </div>

      {submitted && (
        <p className="mt-6 rounded-xl border border-ok/30 bg-ok/5 p-4 text-sm text-ok">
          Thanks! Your mod is pending review. We&apos;ll publish it once it&apos;s checked.
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-line">
        {mine.length === 0 ? (
          <p className="p-8 text-center text-muted">Nothing yet. Your submissions show up here.</p>
        ) : (
          <ul className="divide-y divide-line">
            {mine.map(m => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${BADGE[m.status]}`}>{m.status}</span>
                <span className="font-medium">{m.title}</span>
                {m.reviewNote && <span className="text-sm text-bad">· {m.reviewNote}</span>}
                <span className="ml-auto flex gap-4 text-sm">
                  {m.status === 'published' ? (
                    <Link href={`/mods/${m.slug}`} className="text-muted hover:text-fg">View</Link>
                  ) : (
                    <Link href={`/mods/${m.slug}/edit`} className="text-muted hover:text-fg">Edit</Link>
                  )}
                  <span className="font-mono text-xs text-muted">{m.copyCount} copies</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="mb-6 mt-16 font-display text-3xl tracking-tight">Saved</h2>
      {saved.length ? <ModGrid mods={saved} /> : <p className="text-muted">Save mods you like and they land here.</p>}
    </div>
  )
}
