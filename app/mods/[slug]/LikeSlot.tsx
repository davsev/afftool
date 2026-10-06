'use client'
import { useEffect, useState } from 'react'
import { LikeButton } from '@/components/LikeButton'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

// Loads the viewer's like state in the browser so the page itself stays static.
export function LikeSlot({ modId, count }: { modId: string; count: number }) {
  const [liked, setLiked] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured() || modId.startsWith('seed-')) return setLiked(false)
    const sb = createBrowserSupabase()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setLiked(false)
      const { data: row } = await sb.from('likes').select('mod_id').eq('mod_id', modId).eq('user_id', data.user.id).maybeSingle()
      setLiked(!!row)
    })
  }, [modId])

  if (liked === null) return <span className="inline-block h-9 w-24 rounded-full border border-line" />
  return <LikeButton modId={modId} count={count} liked={liked} />
}
