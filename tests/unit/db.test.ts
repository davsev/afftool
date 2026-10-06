// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const ALICE = '00000000-0000-0000-0000-00000000000a'
const BOB = '00000000-0000-0000-0000-00000000000b'
const ADMIN = '00000000-0000-0000-0000-0000000000ad'

let db: PGlite

async function as(user: string | null, sql: string, params: unknown[] = []) {
  await db.exec('reset role')
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? ''])
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`)
  try {
    return await db.query(sql, params)
  } finally {
    await db.exec('reset role')
  }
}

const insertMod = (slug: string, author: string, status = 'pending') =>
  `insert into mods (slug, author_id, title, tagline, prompt_md, surfaces, reaches, status)
   values ('${slug}', '${author}', 'T', 'Tagline here', 'prompt', '{pane}', '{none}', '${status}')`

beforeAll(async () => {
  db = new PGlite()
  await db.exec(readFileSync('tests/db/supabase-stub.sql', 'utf8'))
  await db.exec(readFileSync('supabase/migrations/0001_init.sql', 'utf8'))
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ALICE}', 'alice@x.dev', '{"user_name":"Alice"}'),
      ('${BOB}', 'bob@x.dev', '{}'),
      ('${ADMIN}', 'admin@x.dev', '{}');
    update profiles set role = 'admin' where id = '${ADMIN}';
  `)
  await as(ALICE, insertMod('alice-pending', ALICE))
  await db.exec(insertMod('alice-live', ALICE, 'published'))
}, 60_000)

describe('database rules', () => {
  it('creates a profile on signup from the GitHub username', async () => {
    const r = await db.query<{ handle: string; github_url: string }>(
      `select handle, github_url from profiles where id = $1`, [ALICE])
    expect(r.rows[0].handle).toMatch(/^alice-/)
    expect(r.rows[0].github_url).toBe('https://github.com/Alice')
  })

  it('hides pending mods from anon and other users', async () => {
    const anon = await as(null, `select slug from mods order by slug`)
    expect(anon.rows).toEqual([{ slug: 'alice-live' }])
    const bob = await as(BOB, `select slug from mods order by slug`)
    expect(bob.rows).toEqual([{ slug: 'alice-live' }])
  })

  it('shows authors their own pending mods', async () => {
    const r = await as(ALICE, `select slug from mods order by slug`)
    expect(r.rows.map((x: any) => x.slug)).toEqual(['alice-live', 'alice-pending'])
  })

  it('blocks authors from publishing themselves', async () => {
    await expect(as(ALICE, `update mods set status = 'published' where slug = 'alice-pending'`)).rejects.toThrow()
    await expect(as(ALICE, insertMod('sneaky', ALICE, 'published'))).rejects.toThrow()
  })

  it('blocks posting as someone else', async () => {
    await expect(as(BOB, insertMod('fake', ALICE))).rejects.toThrow()
  })

  it('ignores author edits to counters', async () => {
    await as(ALICE, `update mods set copy_count = 999, title = 'New' where slug = 'alice-pending'`)
    const r = await db.query<{ copy_count: number; title: string }>(
      `select copy_count, title from mods where slug = 'alice-pending'`)
    expect(r.rows[0]).toEqual({ copy_count: 0, title: 'New' })
  })

  it('lets admins publish and feature', async () => {
    await as(ADMIN, `update mods set status = 'published', is_featured = true where slug = 'alice-pending'`)
    const r = await as(null, `select count(*)::int as n from mods where is_featured`)
    expect(r.rows[0]).toEqual({ n: 1 })
  })

  it('counts copies through track_copy for anon', async () => {
    const id = (await db.query<{ id: string }>(`select id from mods where slug = 'alice-live'`)).rows[0].id
    await as(null, `select track_copy($1, 'copy')`, [id])
    await as(BOB, `select track_copy($1, 'download')`, [id])
    const r = await db.query<{ copy_count: number }>(`select copy_count from mods where id = $1`, [id])
    expect(r.rows[0].copy_count).toBe(2)
  })

  it('keeps like_count in sync and only lets users like as themselves', async () => {
    const id = (await db.query<{ id: string }>(`select id from mods where slug = 'alice-live'`)).rows[0].id
    await as(BOB, `insert into likes (user_id, mod_id) values ($1, $2)`, [BOB, id])
    await expect(as(BOB, `insert into likes (user_id, mod_id) values ($1, $2)`, [ALICE, id])).rejects.toThrow()
    let r = await db.query<{ like_count: number }>(`select like_count from mods where id = $1`, [id])
    expect(r.rows[0].like_count).toBe(1)
    await as(BOB, `delete from likes where user_id = $1 and mod_id = $2`, [BOB, id])
    r = await db.query<{ like_count: number }>(`select like_count from mods where id = $1`, [id])
    expect(r.rows[0].like_count).toBe(0)
  })

  it('blocks users from making themselves admin', async () => {
    await expect(as(BOB, `update profiles set role = 'admin' where id = $1`, [BOB])).rejects.toThrow()
  })

  it('limits uploads to the user folder', async () => {
    await as(BOB, `insert into storage.objects (bucket_id, name) values ('previews', $1)`, [`${BOB}/a.mp4`])
    await expect(as(BOB, `insert into storage.objects (bucket_id, name) values ('previews', $1)`, [`${ALICE}/a.mp4`]))
      .rejects.toThrow()
  })
})
