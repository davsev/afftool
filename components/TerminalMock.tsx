import type { Surface } from '@/lib/schema'

type Props = { lines: string[]; surfaces: Surface[]; accent?: string; large?: boolean }

// A stylized Claude Code window that shows where a mod draws.
// Used as the card preview when a mod has no recorded video.
export function TerminalMock({ lines, surfaces, accent = '#FF6A3D', large }: Props) {
  const primary = surfaces[0]
  const isPane = primary === 'pane'
  const isStatus = primary === 'status'
  const isGuard = primary === 'guard'
  const text = large ? 'text-[13px] sm:text-sm' : 'text-[10.5px] sm:text-[11px]'

  const modLines = (
    <div className={`space-y-1 font-mono ${text} leading-relaxed`}>
      {lines.map((l, i) => (
        <div
          key={i}
          className="truncate whitespace-pre opacity-0"
          style={{ animation: `rise .5s ease-out ${0.15 + i * 0.18}s forwards`, color: i === 0 ? accent : undefined }}
        >
          {l}
        </div>
      ))}
    </div>
  )

  const transcript = (
    <div className="space-y-2" aria-hidden>
      <div className="h-1.5 w-2/3 rounded-full bg-fg/10" />
      <div className="h-1.5 w-1/2 rounded-full bg-fg/[.07]" />
      <div className="h-1.5 w-3/4 rounded-full bg-fg/[.07]" />
      <div className="h-1.5 w-2/5 rounded-full bg-fg/[.05]" />
    </div>
  )

  const prompt = (
    <div className={`rounded-md border border-line/80 px-2.5 py-1.5 font-mono ${text} text-muted`}>
      <span className="caret">&gt; </span>
    </div>
  )

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#0d0d0f] text-fg/90"
      style={{ backgroundImage: `radial-gradient(80% 60% at 70% 0%, ${accent}1f, transparent 70%)` }}
    >
      <div className="flex items-center gap-1.5 border-b border-line/60 px-3 py-2" aria-hidden>
        <span className="size-2 rounded-full bg-fg/15" />
        <span className="size-2 rounded-full bg-fg/15" />
        <span className="size-2 rounded-full bg-fg/15" />
        <span className="ml-2 font-mono text-[10px] text-muted">claude</span>
      </div>
      {isPane ? (
        <div className="grid flex-1 grid-cols-[1fr_1.35fr] gap-3 p-3">
          <div className="flex flex-col justify-between gap-3">
            {transcript}
            {prompt}
          </div>
          <div className="rounded-md border p-2.5" style={{ borderColor: `${accent}55`, background: `${accent}0d` }}>
            {modLines}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-3 p-3">
          {transcript}
          <div className="space-y-2">
            {!isStatus && (
              <div
                className="rounded-md border px-2.5 py-2"
                style={{
                  borderColor: isGuard ? '#FF5C5C66' : `${accent}40`,
                  background: isGuard ? '#FF5C5C0f' : `${accent}0a`,
                }}
              >
                {modLines}
              </div>
            )}
            {prompt}
            {isStatus && <div className="border-t border-line/60 pt-1.5">{modLines}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
