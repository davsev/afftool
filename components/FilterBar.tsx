'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { SURFACES, SURFACE_LABELS } from '@/lib/schema'
import type { Category } from '@/lib/types'

export function FilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const [q, setQ] = useState(params.get('q') ?? '')

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  useEffect(() => {
    if (q === (params.get('q') ?? '')) return
    const t = setTimeout(() => set('q', q.trim() || null), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const surface = params.get('surface')
  const pill = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
      active ? 'border-fg bg-fg text-bg' : 'border-line text-muted hover:border-fg/40 hover:text-fg'
    }`

  return (
    <div className={`space-y-4 transition-opacity ${pending ? 'opacity-60' : ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search mods</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search mods: tokens, CI, guard…"
            className="w-full rounded-full border border-line bg-surface px-5 py-2.5 text-sm placeholder:text-muted/70 focus:border-fg/40 focus:outline-none"
          />
        </label>
        <div className="flex gap-3">
          <select
            aria-label="Category"
            value={params.get('category') ?? ''}
            onChange={e => set('category', e.target.value || null)}
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm focus:outline-none sm:flex-none"
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            aria-label="Sort"
            value={params.get('sort') ?? 'new'}
            onChange={e => set('sort', e.target.value === 'new' ? null : e.target.value)}
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm focus:outline-none sm:flex-none"
          >
            <option value="new">Newest</option>
            <option value="popular">Most copied</option>
          </select>
        </div>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Where it shows">
        <button type="button" className={pill(!surface)} onClick={() => set('surface', null)} aria-pressed={!surface}>
          All
        </button>
        {SURFACES.map(s => (
          <button
            key={s}
            type="button"
            className={pill(surface === s)}
            aria-pressed={surface === s}
            onClick={() => set('surface', surface === s ? null : s)}
          >
            {SURFACE_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
