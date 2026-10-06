import Link from 'next/link'
import { NavUser } from './NavUser'

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-medium tracking-tight">
          <span className="inline-block size-2.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
          modprompts
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted">
          <Link href="/mods" className="hover:text-fg">Browse</Link>
          <Link href="/guide" className="hover:text-fg">Guide</Link>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/submit"
            className="hidden rounded-full border border-line px-4 py-1.5 text-sm hover:border-fg/40 sm:inline-block"
          >
            Submit a mod
          </Link>
          <NavUser />
        </div>
      </nav>
    </header>
  )
}
