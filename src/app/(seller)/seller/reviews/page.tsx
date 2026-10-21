'use client'

import SellerReviewsInbox from '@/components/reviews/SellerReviewsInbox'
import LText from '@/components/shared/LText'
import { MessageSquare } from 'lucide-react'

export default function SellerReviewsPage() {
  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-500" />
            <LText k="customerReviews" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <LText k="sellerReviewsHint" />
          </p>
        </div>

        <SellerReviewsInbox />
      </div>
    </main>
  )
}
