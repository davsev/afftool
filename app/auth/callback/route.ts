import { NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next') ?? '/dashboard'
  // Only allow same-site relative redirects.
  const next = /^\/(?![\/\\])/.test(nextParam) ? nextParam : '/dashboard'

  if (code) {
    const sb = await createSessionClient()
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/login?error=Sign-in%20failed', url.origin))
}
