import { describe, it, expect } from 'vitest'
import { createModRecord, type ModDb } from '@/lib/submit'

const input = {
  title: 'Token Weather',
  tagline: 'Forecast of your context window',
  categorySlug: 'context-tokens',
  surfaces: ['band'],
  reaches: ['none'],
  promptMd: 'Build me a Claude Code mod called token-weather. '.repeat(3),
  repoUrl: '',
  installCmd: '',
}

function fakeDb(opts: { recent?: number; taken?: string[] } = {}) {
  const inserted: Record<string, unknown>[] = []
  const db: ModDb = {
    countRecent: async () => opts.recent ?? 0,
    takenSlugs: async () => opts.taken ?? [],
    categoryId: async slug => (slug === 'context-tokens' ? 6 : null),
    insert: async row => {
      inserted.push(row)
      return { slug: row.slug as string }
    },
  }
  return { db, inserted }
}

describe('createModRecord', () => {
  it('returns field errors for invalid input', async () => {
    const { db, inserted } = fakeDb()
    const r = await createModRecord(db, 'u1', { ...input, title: 'x' }, null)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fieldErrors?.title).toBeTruthy()
    expect(inserted).toHaveLength(0)
  })

  it('inserts a pending mod with a unique slug', async () => {
    const { db, inserted } = fakeDb({ taken: ['token-weather'] })
    const r = await createModRecord(db, 'u1', input, null)
    expect(r).toEqual({ ok: true, slug: 'token-weather-2' })
    expect(inserted[0]).toMatchObject({ author_id: 'u1', status: 'pending', category_id: 6 })
  })

  it('rate limits to 5 submissions a day', async () => {
    const { db } = fakeDb({ recent: 5 })
    const r = await createModRecord(db, 'u1', input, null)
    expect(r).toMatchObject({ ok: false, error: expect.stringMatching(/5 mods a day/) })
  })

  it('rejects an unknown category', async () => {
    const { db } = fakeDb()
    const r = await createModRecord(db, 'u1', { ...input, categorySlug: 'nope' }, null)
    expect(r.ok).toBe(false)
  })

  it('only accepts media from the user folder in our bucket', async () => {
    const { db, inserted } = fakeDb()
    const bad = await createModRecord(db, 'u1', input, {
      url: 'https://evil.example/x.mp4', type: 'video', base: 'https://p.supabase.co',
    })
    expect(bad.ok).toBe(false)
    const good = await createModRecord(db, 'u1', input, {
      url: 'https://p.supabase.co/storage/v1/object/public/previews/u1/a.mp4', type: 'video', base: 'https://p.supabase.co',
    })
    expect(good.ok).toBe(true)
    expect(inserted[0]).toMatchObject({ media_type: 'video' })
  })
})
