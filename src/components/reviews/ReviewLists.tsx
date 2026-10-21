'use client'

import { useProductReviews } from '@/hooks/useReviews'
import { useSellerReviews } from '@/hooks/useSellerReviews'
import { ReviewList, ReviewSummary, type ReviewEntry } from '@/components/reviews/ReviewList'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

function toEntries(reviews: any[]): ReviewEntry[] {
  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? null,
    seller_reply: r.seller_reply ?? null,
    created_at: r.created_at,
    authorName: r.buyer?.full_name ?? 'Mteja',
    authorAvatar: r.buyer?.avatar_url ?? null,
  }))
}

/**
 * The reviews of one product, with the average rating above them.
 */
export function ProductReviewList({ productId }: { productId: string }) {
  const lang = useLangStore((s) => s.lang)
  const { reviews, loading } = useProductReviews(productId)

  if (loading) return null

  const average = reviews.length
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="space-y-4">
      <ReviewSummary average={average} count={reviews.length} />
      <ReviewList entries={toEntries(reviews)} emptyText={t('noReviewsPrompt', lang)} />
    </div>
  )
}

/**
 * The reviews of one seller, with the average rating above them.
 */
export function SellerReviewList({ sellerId }: { sellerId: string }) {
  const lang = useLangStore((s) => s.lang)
  const { reviews, loading, average, count } = useSellerReviews(sellerId)

  if (loading) return null

  return (
    <div className="space-y-4">
      <ReviewSummary average={average} count={count} />
      <ReviewList entries={toEntries(reviews)} emptyText={t('noSellerReviewsYet', lang)} />
    </div>
  )
}
