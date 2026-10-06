import type { MetadataRoute } from 'next'
import { listPublishedSlugs } from '@/lib/mods'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listPublishedSlugs()
  return [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/mods`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/guide`, changeFrequency: 'monthly', priority: 0.6 },
    ...slugs.map(s => ({ url: `${SITE}/mods/${s}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
