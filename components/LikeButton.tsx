'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleLike } from '@/lib/actions'

export function LikeButton({ modId, count, liked: initial }: { modId: string; count: number; liked: boolean }) {
  const router = useRouter()
  const [liked, setLiked] = useState(initial)
  const [n, setN] = useState(count)
  const [, start] = useTransition()

  function click() {
    const next = !liked
    setLiked(next)
    setN(v => v + (next ? 1 : -1))
    start(async () => {
      const r = await toggleLike(modId)
      if ('error' in r) {
        setLiked(!next)
        setN(v => v + (next ? -1 : 1))
        router.push(`/login?next=${encodeURIComponent(location.pathname)}`)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
        liked ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:border-fg/40 hover:text-fg'
      }`}
    >
      <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.65 12 21 12 21z" />
      </svg>
      {liked ? 'Saved' : 'Save'} · {n}
    </button>
  )
}
