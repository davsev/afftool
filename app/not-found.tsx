import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight">Nothing hooked here.</h1>
      <Link href="/mods" className="mt-8 inline-block rounded-full bg-fg px-6 py-3 font-medium text-bg">Browse mods</Link>
    </div>
  )
}
