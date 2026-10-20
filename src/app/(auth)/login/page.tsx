import { redirect } from 'next/navigation'

// The premium onboarding landing at /onboarding hosts the glass Sign In card.
// Forward the optional `redirect` param so post-login destinations still work.
export default function LoginRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = new URLSearchParams()
  params.set('mode', 'signin')
  const target = searchParams['redirect']
  if (typeof target === 'string' && target) params.set('redirect', target)
  redirect(`/onboarding${params.toString() ? `?${params.toString()}` : ''}`)
}

