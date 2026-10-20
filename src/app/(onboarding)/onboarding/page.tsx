'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import OnboardingCard, { type OnboardingMode, type AccountRole } from '@/components/onboarding/OnboardingCard'
import { SimplifiedOnboarding } from '@/components/onboarding/SimplifiedOnboarding'

function OnboardingInner() {
  const params = useSearchParams()

  const mode: OnboardingMode = params.get('mode') === 'signin' ? 'signin' : 'signup'
  const flow = params.get('flow') // simple = new 3-step, legacy = old card

  const typeParam = params.get('type')
  const type: AccountRole | undefined =
    typeParam === 'buyer' || typeParam === 'seller' || typeParam === 'rider' ? typeParam : undefined

  // Default to simplified 3-step flow for local users — large touch targets, Swahili-first
  const useSimple = flow !== 'legacy'

  if (useSimple && mode === 'signup') {
    return (
      <div className="flex justify-center w-full">
        <SimplifiedOnboarding />
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <OnboardingCard key={`${mode}-${type ?? 'none'}`} initialMode={mode} initialType={type} />
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={null}>
      <OnboardingInner />
    </React.Suspense>
  )
}

