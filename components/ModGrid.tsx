import type { Mod } from '@/lib/types'
import { ModCard } from './ModCard'

export function ModGrid({ mods }: { mods: Mod[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {mods.map((m, i) => (
        <ModCard key={m.id} mod={m} index={i} />
      ))}
    </div>
  )
}
