import { SEED_MODS, CATEGORIES } from '@/content/seed-mods'
import { isSupabaseConfigured } from './supabase/env'
import { createPublicClient } from './supabase/public'
import type { Category, Mod, ModFilters } from './types'

export const PAGE_SIZE = 24

export const MOD_SELECT =
  '*, categories(slug, name), profiles!mods_author_id_fkey(id, handle, display_name, avatar_url)'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function rowToMod(r: any): Mod {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    descriptionMd: r.description_md ?? '',
    promptMd: r.prompt_md,
    category: r.categories ? { slug: r.categories.slug, name: r.categories.name } : null,
    surfaces: r.surfaces ?? [],
    reaches: r.reaches ?? [],
    previewUrl: r.preview_url,
    posterUrl: r.poster_url,
    mediaType: r.media_type,
    repoUrl: r.repo_url,
    installCmd: r.install_cmd,
    minCcVersion: r.min_cc_version,
    status: r.status,
    reviewNote: r.review_note,
    isFeatured: !!r.is_featured,
    copyCount: r.copy_count ?? 0,
    likeCount: r.like_count ?? 0,
    publishedAt: r.published_at,
    author: {
      id: r.profiles?.id ?? r.author_id,
      handle: r.profiles?.handle ?? 'unknown',
      displayName: r.profiles?.display_name ?? null,
      avatarUrl: r.profiles?.avatar_url ?? null,
    },
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ModPage = { items: Mod[]; total: number; hasMore: boolean }

// In-memory version of the gallery query, used in demo mode and in tests.
export function applyFilters(mods: Mod[], f: ModFilters): ModPage {
  const q = f.q?.trim().toLowerCase()
  let list = mods.filter(m => m.status === 'published')
  if (f.surface) list = list.filter(m => m.surfaces.includes(f.surface as Mod['surfaces'][number]))
  if (f.category) list = list.filter(m => m.category?.slug === f.category)
  if (q) list = list.filter(m => `${m.title} ${m.tagline} ${m.descriptionMd}`.toLowerCase().includes(q))
  list = [...list].sort((a, b) =>
    f.sort === 'popular'
      ? b.copyCount - a.copyCount
      : (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
  )
  const page = Math.max(1, f.page ?? 1)
  const items = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return { items, total: list.length, hasMore: page * PAGE_SIZE < list.length }
}

export async function listMods(f: ModFilters): Promise<ModPage> {
  if (!isSupabaseConfigured()) return applyFilters(SEED_MODS, f)
  const page = Math.max(1, f.page ?? 1)
  let query = createPublicClient()
    .from('mods')
    .select(MOD_SELECT.replace('categories(', f.category ? 'categories!inner(' : 'categories('), { count: 'exact' })
    .eq('status', 'published')
  if (f.surface) query = query.contains('surfaces', [f.surface])
  if (f.category) query = query.eq('categories.slug', f.category)
  if (f.q?.trim()) query = query.textSearch('fts', f.q.trim(), { type: 'websearch' })
  query = f.sort === 'popular'
    ? query.order('copy_count', { ascending: false })
    : query.order('published_at', { ascending: false })
  const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (error) throw error
  return { items: (data ?? []).map(rowToMod), total: count ?? 0, hasMore: page * PAGE_SIZE < (count ?? 0) }
}

export async function listFeatured(): Promise<Mod[]> {
  if (!isSupabaseConfigured()) return SEED_MODS.filter(m => m.isFeatured)
  const { data, error } = await createPublicClient()
    .from('mods').select(MOD_SELECT).eq('status', 'published').eq('is_featured', true)
    .order('published_at', { ascending: false }).limit(6)
  if (error) throw error
  return (data ?? []).map(rowToMod)
}

export async function getPublishedMod(slug: string): Promise<Mod | null> {
  if (!isSupabaseConfigured()) return SEED_MODS.find(m => m.slug === slug) ?? null
  const { data, error } = await createPublicClient()
    .from('mods').select(MOD_SELECT).eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error) throw error
  return data ? rowToMod(data) : null
}

export async function listPublishedSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return SEED_MODS.map(m => m.slug)
  const { data } = await createPublicClient().from('mods').select('slug').eq('status', 'published')
  return (data ?? []).map(r => r.slug)
}

export async function listByAuthorHandle(handle: string) {
  if (!isSupabaseConfigured()) {
    const mods = SEED_MODS.filter(m => m.author.handle === handle)
    return mods.length ? { author: mods[0].author, mods } : null
  }
  const sb = createPublicClient()
  const { data: profile } = await sb
    .from('profiles').select('id, handle, display_name, avatar_url, bio, github_url').eq('handle', handle).maybeSingle()
  if (!profile) return null
  const { data } = await sb
    .from('mods').select(MOD_SELECT).eq('author_id', profile.id).eq('status', 'published')
    .order('published_at', { ascending: false })
  return {
    author: { id: profile.id, handle: profile.handle, displayName: profile.display_name, avatarUrl: profile.avatar_url },
    bio: profile.bio as string | null,
    githubUrl: profile.github_url as string | null,
    mods: (data ?? []).map(rowToMod),
  }
}

export async function listRelated(mod: Mod): Promise<Mod[]> {
  const { items } = await listMods({ category: mod.category?.slug })
  const others = items.filter(m => m.slug !== mod.slug)
  if (others.length >= 3) return others.slice(0, 3)
  const { items: recent } = await listMods({})
  return [...others, ...recent.filter(m => m.slug !== mod.slug && !others.includes(m))].slice(0, 3)
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return CATEGORIES
  const { data } = await createPublicClient().from('categories').select('slug, name').order('sort_order')
  return data ?? CATEGORIES
}
