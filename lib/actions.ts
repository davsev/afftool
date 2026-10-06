'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from './auth'
import { isSupabaseConfigured, SUPABASE_URL } from './supabase/env'
import { createSessionClient } from './supabase/server'
import { createModRecord, isOwnMediaUrl, parseModInput, type Media, type ModDb, type SubmitResult } from './submit'

export async function trackCopy(modId: string, kind: 'copy' | 'download') {
  if (!isSupabaseConfigured() || modId.startsWith('seed-')) return
  const sb = await createSessionClient()
  await sb.rpc('track_copy', { p_mod: modId, p_kind: kind })
}

export async function toggleLike(modId: string): Promise<{ liked: boolean } | { error: 'auth' }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'auth' }
  const sb = await createSessionClient()
  const { data } = await sb.from('likes').select('mod_id').eq('user_id', user.id).eq('mod_id', modId).maybeSingle()
  if (data) {
    await sb.from('likes').delete().eq('user_id', user.id).eq('mod_id', modId)
    return { liked: false }
  }
  await sb.from('likes').insert({ user_id: user.id, mod_id: modId })
  return { liked: true }
}

function formToInput(fd: FormData) {
  return {
    title: String(fd.get('title') ?? ''),
    tagline: String(fd.get('tagline') ?? ''),
    descriptionMd: String(fd.get('descriptionMd') ?? ''),
    categorySlug: String(fd.get('categorySlug') ?? ''),
    surfaces: fd.getAll('surfaces').map(String),
    reaches: fd.getAll('reaches').map(String),
    promptMd: String(fd.get('promptMd') ?? ''),
    repoUrl: String(fd.get('repoUrl') ?? '').trim(),
    installCmd: String(fd.get('installCmd') ?? '').trim(),
    minCcVersion: String(fd.get('minCcVersion') ?? '').trim(),
  }
}

function formToMedia(fd: FormData): Media {
  const url = String(fd.get('previewUrl') ?? '')
  const type = String(fd.get('mediaType') ?? '') as 'video' | 'gif' | 'image'
  if (!url || !['video', 'gif', 'image'].includes(type)) return null
  return { url, type, base: SUPABASE_URL, posterUrl: String(fd.get('posterUrl') ?? '') || null }
}

export async function submitMod(_prev: SubmitResult | null, fd: FormData): Promise<SubmitResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Sign in to submit a mod.' }
  const sb = await createSessionClient()

  const db: ModDb = {
    countRecent: async uid => {
      const since = new Date(Date.now() - 86_400_000).toISOString()
      const { count } = await sb.from('mods').select('id', { count: 'exact', head: true })
        .eq('author_id', uid).gte('created_at', since)
      return count ?? 0
    },
    takenSlugs: async base => {
      const { data } = await sb.from('mods').select('slug').like('slug', `${base}%`)
      return (data ?? []).map(r => r.slug)
    },
    categoryId: async slug => {
      const { data } = await sb.from('categories').select('id').eq('slug', slug).maybeSingle()
      return data?.id ?? null
    },
    insert: async row => {
      const { data, error } = await sb.from('mods').insert(row).select('slug').single()
      if (error) throw error
      return data
    },
  }

  const res = await createModRecord(db, user.id, formToInput(fd), formToMedia(fd))
  if (res.ok) {
    revalidatePath('/dashboard')
    redirect(`/dashboard?submitted=${res.slug}`)
  }
  return res
}

export async function updateMod(modId: string, _prev: SubmitResult | null, fd: FormData): Promise<SubmitResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Sign in first.' }
  const parsed = parseModInput(formToInput(fd))
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  const v = parsed.data
  const media = formToMedia(fd)
  if (media && !isOwnMediaUrl(media.url, user.id, SUPABASE_URL)) {
    return { ok: false, error: 'Preview must be uploaded through the form.' }
  }
  const sb = await createSessionClient()
  const { data: cat } = await sb.from('categories').select('id').eq('slug', v.categorySlug).maybeSingle()
  if (!cat) return { ok: false, fieldErrors: { categorySlug: ['Pick a category'] } }

  const { data, error } = await sb
    .from('mods')
    .update({
      title: v.title,
      tagline: v.tagline,
      description_md: v.descriptionMd,
      prompt_md: v.promptMd,
      category_id: cat.id,
      surfaces: v.surfaces,
      reaches: v.reaches,
      repo_url: v.repoUrl || null,
      install_cmd: v.installCmd || null,
      min_cc_version: v.minCcVersion || null,
      ...(media ? { preview_url: media.url, poster_url: media.posterUrl ?? null, media_type: media.type } : {}),
      status: 'pending',
    })
    .eq('id', modId)
    .eq('author_id', user.id)
    .neq('status', 'published')
    .select('slug')
    .maybeSingle()
  if (error || !data) return { ok: false, error: 'Only unpublished mods can be edited.' }
  revalidatePath('/dashboard')
  redirect(`/dashboard?submitted=${data.slug}`)
}

export async function moderateMod(fd: FormData) {
  const user = await getCurrentUser()
  if (user?.role !== 'admin') throw new Error('Not allowed')
  const id = String(fd.get('id'))
  const action = String(fd.get('action'))
  const note = String(fd.get('note') ?? '').trim()
  const sb = await createSessionClient()

  const patch: Record<string, unknown> =
    action === 'approve'
      ? { status: 'published', published_at: new Date().toISOString(), review_note: null }
      : action === 'reject'
        ? { status: 'rejected', review_note: note || 'Rejected' }
        : action === 'feature'
          ? { is_featured: true }
          : action === 'unfeature'
            ? { is_featured: false }
            : {}
  if (action === 'reject' && !note) return
  const { data } = await sb.from('mods').update(patch).eq('id', id).select('slug').single()
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/mods')
  if (data) revalidatePath(`/mods/${data.slug}`)
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const sb = await createSessionClient()
    await sb.auth.signOut()
  }
  redirect('/')
}
