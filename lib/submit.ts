import { modInput } from './schema'
import { slugify, uniqueSlug } from './slug'

export const DAILY_LIMIT = 5

export type ModDb = {
  countRecent: (userId: string) => Promise<number>
  takenSlugs: (base: string) => Promise<string[]>
  categoryId: (slug: string) => Promise<number | null>
  insert: (row: Record<string, unknown>) => Promise<{ slug: string }>
}

export type Media = { url: string; type: 'video' | 'gif' | 'image'; base: string; posterUrl?: string | null } | null

export type SubmitResult =
  | { ok: true; slug: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[] | undefined> }

export function isOwnMediaUrl(url: string, userId: string, base: string) {
  return url.startsWith(`${base}/storage/v1/object/public/previews/${userId}/`)
}

export function parseModInput(raw: unknown) {
  return modInput.safeParse(raw)
}

export async function createModRecord(db: ModDb, userId: string, raw: unknown, media: Media): Promise<SubmitResult> {
  const parsed = parseModInput(raw)
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  const v = parsed.data

  if ((await db.countRecent(userId)) >= DAILY_LIMIT) {
    return { ok: false, error: `You can submit up to ${DAILY_LIMIT} mods a day. Try again tomorrow.` }
  }
  const categoryId = await db.categoryId(v.categorySlug)
  if (!categoryId) return { ok: false, fieldErrors: { categorySlug: ['Pick a category'] } }
  if (media && !isOwnMediaUrl(media.url, userId, media.base)) {
    return { ok: false, error: 'Preview must be uploaded through the form.' }
  }

  const base = slugify(v.title)
  const slug = uniqueSlug(base, await db.takenSlugs(base))
  const row = await db.insert({
    slug,
    author_id: userId,
    title: v.title,
    tagline: v.tagline,
    description_md: v.descriptionMd,
    prompt_md: v.promptMd,
    category_id: categoryId,
    surfaces: v.surfaces,
    reaches: v.reaches,
    repo_url: v.repoUrl || null,
    install_cmd: v.installCmd || null,
    min_cc_version: v.minCcVersion || null,
    preview_url: media?.url ?? null,
    poster_url: media?.posterUrl ?? null,
    media_type: media?.type ?? null,
    status: 'pending',
  })
  return { ok: true, slug: row.slug }
}
