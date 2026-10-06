'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState(params.get('error') ?? '')

  if (!isSupabaseConfigured()) {
    return (
      <p className="mt-8 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm text-warn">
        Demo mode: accounts are off until Supabase is configured. Set NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </p>
    )
  }

  const redirectTo = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  async function oauth(provider: 'github' | 'google') {
    const { error } = await createBrowserSupabase().auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } })
    if (error) setError(error.message)
  }

  async function magic(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    const { error } = await createBrowserSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })
    if (error) {
      setError(error.message)
      setState('error')
    } else setState('sent')
  }

  const btn = 'flex w-full items-center justify-center gap-3 rounded-full px-5 py-3 font-medium transition-colors'

  return (
    <div className="mt-10 space-y-3">
      <button onClick={() => oauth('github')} className={`${btn} bg-fg text-bg hover:bg-white`}>
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
        </svg>
        Continue with GitHub
      </button>
      <button onClick={() => oauth('google')} className={`${btn} border border-line hover:border-fg/40`}>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 py-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or email <span className="h-px flex-1 bg-line" />
      </div>
      {state === 'sent' ? (
        <p className="rounded-xl border border-ok/30 bg-ok/5 p-4 text-sm text-ok">Check your inbox for a sign-in link.</p>
      ) : (
        <form onSubmit={magic} className="space-y-3">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-line bg-surface px-5 py-3 focus:border-fg/40 focus:outline-none"
            />
          </label>
          <button disabled={state === 'sending'} className={`${btn} border border-line hover:border-fg/40 disabled:opacity-60`}>
            {state === 'sending' ? 'Sending…' : 'Email me a link'}
          </button>
        </form>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  )
}
