import { redirect } from 'next/navigation'

// The premium onboarding landing at /onboarding hosts the glass Sign Up card.
// Forward the optional `type` param (buyer | seller | rider) to pre-select the role.
export default function RegisterRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const params = new URLSearchParams()
  params.set('mode', 'signup')
  const type = searchParams['type']
  if (typeof type === 'string' && (type === 'buyer' || type === 'seller' || type === 'rider')) {
    params.set('type', type)
  }
  redirect(`/onboarding?${params.toString()}`)
}

