'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import React, { Suspense } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageLoader } from '@/components/ui'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

const ReelsFeed = dynamic(() => import('@/components/reels/ReelsFeed'), {
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  ssr: false
})

export default function ReelsPage() {
  const searchParams = useSearchParams()
  const { lang } = useLangStore()

  const hashtag = searchParams.get('hashtag') || undefined
  const sellerId = searchParams.get('sellerId') || undefined

  return (
    <main className="h-screen w-full overflow-hidden bg-black">
      <React.Suspense fallback={<PageLoader />}>
        <ReelsFeed
          hashtag={hashtag}
          sellerId={sellerId}
        />
      </React.Suspense>
    </main>
  )
}

