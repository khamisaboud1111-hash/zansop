export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const DEFAULT_REDIRECT = '/'

function sanitizeNext(next: string | null): string {
  if (!next) return DEFAULT_REDIRECT
  if (!next.startsWith('/')) return DEFAULT_REDIRECT
  if (next.startsWith('//')) return DEFAULT_REDIRECT
  if (next.includes('\\')) return DEFAULT_REDIRECT
  return next
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = sanitizeNext(searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code${encodeRedirect(next)}`)
  }

  const supabase = createServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback code exchange failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed${encodeRedirect(next)}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}

function encodeRedirect(next: string) {
  return next === DEFAULT_REDIRECT ? '' : `&redirect=${encodeURIComponent(next)}`
}

