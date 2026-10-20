const CANONICAL_ORIGIN = 'https://zanshop-pi.vercel.app'
const ALLOWED_ORIGINS = new Set([
  CANONICAL_ORIGIN,
  'https://zanshop.co.tz',
  'http://localhost:3000',
])

function stripTrailingSlash(value: string) {
  return value.trim().replace(/\/+$/, '')
}

export function normalizeOrigin(value: string | undefined | null): string | null {
  if (!value) return null
  const candidate = stripTrailingSlash(value)
  if (!candidate) return null

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  if (parsed.hostname.endsWith('.supabase.co')) return null

  return stripTrailingSlash(parsed.origin)
}

export function getSiteOrigin(): string {
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)
  if (configured && ALLOWED_ORIGINS.has(configured)) return configured
  return CANONICAL_ORIGIN
}

export function getSiteUrl(path = '/'): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${getSiteOrigin()}${suffix}`
}


