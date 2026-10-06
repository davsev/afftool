import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
        <p>Independent community project, not affiliated with Anthropic.</p>
        <div className="flex gap-5 sm:ml-auto">
          <Link href="/guide" className="hover:text-fg">Guide</Link>
          <Link href="/submit" className="hover:text-fg">Submit</Link>
          <a href="https://code.claude.com/docs/en/plugins/mods/overview" className="hover:text-fg" target="_blank" rel="noreferrer">
            Mods docs
          </a>
        </div>
      </div>
    </footer>
  )
}
