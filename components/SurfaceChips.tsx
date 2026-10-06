import { SURFACE_LABELS, type Surface } from '@/lib/schema'

export function SurfaceChips({ surfaces, size = 'sm' }: { surfaces: Surface[]; size?: 'sm' | 'md' }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {surfaces.map(s => (
        <li
          key={s}
          className={`rounded-full border border-line bg-raised/60 text-muted ${
            size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
          }`}
        >
          {SURFACE_LABELS[s]}
        </li>
      ))}
    </ul>
  )
}
