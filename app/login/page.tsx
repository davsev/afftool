import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <div className="glow relative">
      <div className="mx-auto max-w-sm px-4 py-24">
        <h1 className="font-display text-5xl tracking-tight">Sign in</h1>
        <p className="mt-3 text-muted">Share your mods, save the ones you like.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
