const CANONICAL_ORIGIN = 'https://zanshop-khamis.vercel.app'
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
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const configured = normalizeOrigin(raw)

  if (configured && ALLOWED_ORIGINS.has(configured)) {
    return configured
  }

  if (raw) {
    console.warn(
      `[site] Ignoring NEXT_PUBLIC_APP_URL="${raw}" because it is not an allowed origin. Falling back to ${CANONICAL_ORIGIN}.`
    )
  }

  return CANONICAL_ORIGIN
}

export function getSiteUrl(path = '/'): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${getSiteOrigin()}${suffix}`
}


