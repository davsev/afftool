import { describe, it, expect } from 'vitest'
import { applyFilters, rowToMod, PAGE_SIZE } from '@/lib/mods'
import { SEED_MODS } from '@/content/seed-mods'

describe('applyFilters', () => {
  it('returns published mods newest first by default', () => {
    const r = applyFilters(SEED_MODS, {})
    expect(r.items[0].slug).toBe(SEED_MODS[0].slug)
    expect(r.total).toBe(SEED_MODS.length)
  })
  it('filters by surface', () => {
    const r = applyFilters(SEED_MODS, { surface: 'guard' })
    expect(r.items.length).toBeGreaterThan(0)
    expect(r.items.every(m => m.surfaces.includes('guard'))).toBe(true)
  })
  it('filters by category', () => {
    const r = applyFilters(SEED_MODS, { category: 'safety' })
    expect(r.items.every(m => m.category?.slug === 'safety')).toBe(true)
  })
  it('searches title, tagline and description case-insensitively', () => {
    expect(applyFilters(SEED_MODS, { q: 'POMODORO' }).items.map(m => m.slug)).toEqual(['focus-timer'])
  })
  it('sorts by popularity', () => {
    const r = applyFilters(SEED_MODS, { sort: 'popular' })
    const counts = r.items.map(m => m.copyCount)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })
  it('pages results', () => {
    const many = Array.from({ length: PAGE_SIZE + 3 }, (_, i) => ({ ...SEED_MODS[0], id: `x${i}`, slug: `x${i}` }))
    const p2 = applyFilters(many, { page: 2 })
    expect(p2.items.length).toBe(3)
    expect(p2.hasMore).toBe(false)
    expect(applyFilters(many, { page: 1 }).hasMore).toBe(true)
  })
  it('skips unpublished mods', () => {
    const r = applyFilters([{ ...SEED_MODS[0], status: 'pending' }], {})
    expect(r.items).toEqual([])
  })
})

describe('rowToMod', () => {
  it('maps a database row', () => {
    const m = rowToMod({
      id: '1', slug: 's', title: 'T', tagline: 'tag', description_md: 'd', prompt_md: 'p',
      categories: { slug: 'safety', name: 'Safety' }, surfaces: ['pane'], reaches: ['none'],
      preview_url: null, poster_url: null, media_type: null, repo_url: null, install_cmd: null,
      min_cc_version: null, status: 'published', review_note: null, is_featured: true,
      copy_count: 3, like_count: 1, published_at: '2026-10-01T00:00:00Z',
      profiles: { id: 'u', handle: 'h', display_name: 'H', avatar_url: null },
    })
    expect(m.category).toEqual({ slug: 'safety', name: 'Safety' })
    expect(m.author.handle).toBe('h')
    expect(m.isFeatured).toBe(true)
  })
})
