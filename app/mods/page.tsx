import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getCategories, listMods } from '@/lib/mods'
import { FilterBar } from '@/components/FilterBar'
import { ModGrid } from '@/components/ModGrid'

export const metadata: Metadata = { title: 'Browse mods' }

type Search = Promise<Record<string, string | undefined>>

export default async function BrowsePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const filters = {
    surface: sp.surface,
    category: sp.category,
    q: sp.q,
    sort: sp.sort === 'popular' ? ('popular' as const) : ('new' as const),
  }
  const [categories, result] = await Promise.all([getCategories(), listMods({ ...filters, page })])
  // Show everything up to the current page so "Load more" keeps earlier results.
  const pages = page > 1 ? await Promise.all(Array.from({ length: page - 1 }, (_, i) => listMods({ ...filters, page: i + 1 }))) : []
  const items = [...pages.flatMap(p => p.items), ...result.items]
  const more = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][])
  more.set('page', String(page + 1))

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-4xl tracking-tight sm:text-6xl">Browse mods</h1>
      <p className="mt-3 text-muted">{result.total} mods with copy-ready build prompts.</p>
      <div className="mt-8">
        <Suspense>
          <FilterBar categories={categories} />
        </Suspense>
      </div>
      <div className="mt-8">
        {items.length ? (
          <ModGrid mods={items} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-12 text-center">
            <p className="text-muted">No mods match that yet.</p>
            <Link href="/submit" className="mt-4 inline-block rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg">
              Be the first to submit one
            </Link>
          </div>
        )}
      </div>
      {result.hasMore && (
        <div className="mt-10 text-center">
          <Link href={`/mods?${more}`} scroll={false} className="rounded-full border border-line px-6 py-2.5 text-sm hover:border-fg/40">
            Load more
          </Link>
        </div>
      )}
    </div>
  )
}
