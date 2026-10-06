'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { Avatar } from './Avatar'

type Me = { avatarUrl: string | null; name: string } | null

// Client-side so public pages can stay static.
export function NavUser() {
  const [me, setMe] = useState<Me | undefined>(undefined)

  useEffect(() => {
    if (!isSupabaseConfigured()) return setMe(null)
    const sb = createBrowserSupabase()
    const load = async () => {
      const { data } = await sb.auth.getUser()
      if (!data.user) return setMe(null)
      const m = data.user.user_metadata ?? {}
      setMe({ avatarUrl: m.avatar_url ?? null, name: m.full_name ?? m.user_name ?? data.user.email ?? '?' })
    }
    load()
    const { data: sub } = sb.auth.onAuthStateChange(() => void load())
    return () => sub.subscription.unsubscribe()
  }, [])

  if (me === undefined) return <span className="size-[30px]" />
  if (me) {
    return (
      <Link href="/dashboard" aria-label="Your dashboard">
        <Avatar url={me.avatarUrl} name={me.name} size={30} />
      </Link>
    )
  }
  return (
    <Link href="/login" className="rounded-full bg-fg px-4 py-1.5 text-sm font-medium text-bg hover:bg-white">
      Sign in
    </Link>
  )
}
