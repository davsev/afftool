import type { Reach, Surface } from './schema'

export type ModStatus = 'draft' | 'pending' | 'published' | 'rejected'

export type Author = {
  id: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
}

export type Category = { slug: string; name: string }

// What the animated card preview draws when a mod has no recorded video.
export type MockSpec = {
  lines: string[]
  accent?: string
}

export type Mod = {
  id: string
  slug: string
  title: string
  tagline: string
  descriptionMd: string
  promptMd: string
  category: Category | null
  surfaces: Surface[]
  reaches: Reach[]
  previewUrl: string | null
  posterUrl: string | null
  mediaType: 'video' | 'gif' | 'image' | null
  repoUrl: string | null
  installCmd: string | null
  minCcVersion: string | null
  status: ModStatus
  reviewNote: string | null
  isFeatured: boolean
  copyCount: number
  likeCount: number
  publishedAt: string | null
  author: Author
  mock?: MockSpec
}

export type ModFilters = {
  surface?: string
  category?: string
  q?: string
  sort?: 'new' | 'popular'
  page?: number
}
