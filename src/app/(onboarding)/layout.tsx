import type { Metadata } from 'next'
import OnboardingShell from '@/components/onboarding/OnboardingShell'

export const metadata: Metadata = {
  title: 'Welcome to Zanshop',
  description: 'Sell and buy online wherever you are in Zanzibar. Shopping made easy.',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingShell>{children}</OnboardingShell>
}


