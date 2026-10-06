import { ImageResponse } from 'next/og'
import { getPublishedMod } from '@/lib/mods'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const mod = await getPublishedMod((await params).slug)
  const accent = mod?.mock?.accent ?? '#FF6A3D'
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: 72, background: `radial-gradient(70% 60% at 80% 0%, ${accent}40, #0A0A0B 70%)`, color: '#F5F3EF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 30 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: '#FF6A3D' }} />
          modprompts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 84, letterSpacing: -2, lineHeight: 1 }}>{mod?.title ?? 'Claude Code mod'}</div>
          <div style={{ fontSize: 34, color: '#8A8A90', maxWidth: 960 }}>{mod?.tagline ?? ''}</div>
        </div>
        <div style={{ fontSize: 26, color: accent }}>Copy the prompt. Build it in Claude Code.</div>
      </div>
    ),
    size,
  )
}
