import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_ROUTES = ['/admin']
const SELLER_ROUTES = ['/seller']
const RIDER_ROUTES = ['/rider']
const PROTECTED_ROUTES = ['/orders', '/wishlist', '/notifications', '/checkout', '/messages']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']
const PUBLIC_PREFIXES = ['/products', '/sellers', '/search', '/categories', '/policies', '/onboarding', '/welcome', '/_next', '/api', '/favicon.ico', '/login', '/register', '/forgot-password', '/update-password']

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const pathname = req.nextUrl.pathname

  // /login and /register only exist to forward to the onboarding screen.
  //
  // Doing that with a server-side redirect() inside the page marks the
  // Suspense boundary as errored - the HTML comes back with a <!--$!-->
  // marker and a NEXT_REDIRECT template - and React cannot hydrate an
  // errored boundary. Every visit to /login or /register threw a hydration
  // error and React threw the server HTML away, so the whole page was
  // re-rendered on the client. Redirecting here, before anything is
  // rendered, keeps it a plain HTTP redirect with no hydration involved.
  const AUTH_REDIRECTS: Record<string, string> = {
    '/login': 'signin',
    '/register': 'signup',
  }

  const authTarget = AUTH_REDIRECTS[pathname]
  if (authTarget) {
    const url = req.nextUrl.clone()
    url.pathname = '/onboarding'
    url.search = ''
    url.searchParams.set('mode', authTarget)
    const redirect = req.nextUrl.searchParams.get('redirect')
    if (redirect && redirect.startsWith('/')) {
      url.searchParams.set('redirect', redirect)
    }
    return NextResponse.redirect(url)
  }

  // Allow all public routes
  if (PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return res
  }

  // Allow auth routes
  if (AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return res
  }

  // Skip static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          res.cookies.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          res.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

const { data: { user } } = await supabase.auth.getUser()

  // Welcome page logic: redirect unauthenticated users from root to /welcome
  // and authenticated users from /welcome to root (marketplace)
  if (pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/welcome', req.url))
    }
    // Authenticated users stay at root (marketplace)
    return res
  }

  if (pathname === '/welcome' && user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Protect routes that require authentication
  const needsAuth = 
    PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`)) ||
    SELLER_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`)) ||
    RIDER_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`)) ||
    ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(`${r}/`))

  if (!user && needsAuth) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin check - use role from database
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

