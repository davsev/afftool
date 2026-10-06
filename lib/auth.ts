import { cache } from 'react'
import { isSupabaseConfigured } from './supabase/env'
import { createSessionClient } from './supabase/server'

export type CurrentUser = {
  id: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
  role: 'user' | 'admin'
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null
  const sb = await createSessionClient()
  const { data } = await sb.auth.getUser()
  if (!data.user) return null
  const { data: p } = await sb
    .from('profiles')
    .select('id, handle, display_name, avatar_url, role')
    .eq('id', data.user.id)
    .maybeSingle()
  if (!p) return null
  return { id: p.id, handle: p.handle, displayName: p.display_name, avatarUrl: p.avatar_url, role: p.role }
})
