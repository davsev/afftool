'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from 'react'
import type { Mod } from '@/lib/types'
import { TerminalMock } from './TerminalMock'

type Props = { mod: Pick<Mod, 'previewUrl' | 'posterUrl' | 'mediaType' | 'surfaces' | 'mock' | 'title'>; large?: boolean }

export function PreviewMedia({ mod, large }: Props) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const hover = window.matchMedia('(hover: hover)').matches
    if (large || !hover) {
      // Touch screens and the detail page: play while on screen.
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
        threshold: 0.6,
      })
      io.observe(v)
      return () => io.disconnect()
    }
    const card = v.closest('[data-card]') ?? v
    const play = () => v.play().catch(() => {})
    const stop = () => v.pause()
    card.addEventListener('mouseenter', play)
    card.addEventListener('mouseleave', stop)
    return () => {
      card.removeEventListener('mouseenter', play)
      card.removeEventListener('mouseleave', stop)
    }
  }, [large])

  if (mod.previewUrl && mod.mediaType === 'video') {
    return (
      <video
        ref={ref}
        src={mod.previewUrl}
        poster={mod.posterUrl ?? undefined}
        muted
        loop
        playsInline
        preload={large ? 'metadata' : 'none'}
        className="h-full w-full object-cover"
        aria-label={`${mod.title} preview`}
      />
    )
  }
  if (mod.previewUrl) {
    return <img src={mod.previewUrl} alt={`${mod.title} preview`} className="h-full w-full object-cover" loading="lazy" />
  }
  return <TerminalMock lines={mod.mock?.lines ?? [mod.title]} surfaces={mod.surfaces} accent={mod.mock?.accent} large={large} />
}
