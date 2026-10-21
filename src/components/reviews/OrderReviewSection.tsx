'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { CheckCircle2, Package, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/StarRating'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import ReviewForm from '@/components/product/ReviewForm'
import SellerReviewForm from '@/components/reviews/SellerReviewForm'
import DeliveryRatingSection from '@/components/delivery/DeliveryRatingSection'

export interface ReviewableItem {
  product_id: string
  product_name: string
  seller_id: string
  seller_name: string
}

interface ExistingReview {
  id: string
  product_id: string
  rating: number
  comment: string | null
  seller_reply: string | null
}

function ReviewGiven({ review }: { review: ExistingReview }) {
  const lang = useLangStore((s) => s.lang)
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{t('yourReview', lang)}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-xs text-muted-foreground">{review.rating}/5</span>
          </div>
          {review.comment && (
            <p className="text-sm text-muted-foreground mt-1.5 italic">&quot;{review.comment}&quot;</p>
          )}
          {review.seller_reply && (
            <div className="mt-2 border-l-2 border-brand-500/40 pl-3">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">{t('sellerReply', lang)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{review.seller_reply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Everything a buyer can say about a delivered order: a rating and comment
 * for the shop, a rating and comment for each product, and a rating for the
 * rider who delivered it.
 */
export default function OrderReviewSection({
  orderId,
  buyerId,
  items,
}: {
  orderId: string
  buyerId: string
  items: ReviewableItem[]
}) {
  const lang = useLangStore((s) => s.lang)
  const supabase = useMemo(() => createClient(), [])
  const [myReviews, setMyReviews] = useState<ExistingReview[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, product_id, rating, comment, seller_reply')
      .eq('order_id', orderId)
      .eq('buyer_id', buyerId)
    setMyReviews((data ?? []) as ExistingReview[])
    setLoading(false)
  }, [orderId, buyerId, supabase])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await load()
    })()
    return () => { cancelled = true }
  }, [load])

  if (loading) return null

  const reviewed = new Map(myReviews.map((r) => [r.product_id, r]))
  const sellerIds = Array.from(new Set(items.map((i) => i.seller_id)))

  return (
    <section className="mt-4 space-y-4">
      <h2 className="font-display font-bold text-lg text-foreground">{t('rateThisOrder', lang)}</h2>

      {sellerIds.map((sellerId) => {
        const sellerItems = items.filter((i) => i.seller_id === sellerId)
        const sellerName = sellerItems[0]?.seller_name ?? ''
        return (
          <SellerReviewForm
            key={sellerId}
            orderId={orderId}
            sellerId={sellerId}
            sellerName={sellerName}
          />
        )
      })}

      {items.map((item) => {
        const existing = reviewed.get(item.product_id)
        if (existing) {
          return <ReviewGiven key={item.product_id} review={existing} />
        }
        return (
          <ReviewForm
            key={item.product_id}
            productId={item.product_id}
            orderId={orderId}
            productName={item.product_name}
            onSubmitted={load}
          />
        )
      })}

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center flex-shrink-0">
            <Package className="w-4.5 h-4.5 text-brand-600 dark:text-brand-300" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{t('rateTheRider', lang)}</p>
            <p className="text-xs text-muted-foreground">{t('rateTheRiderHint', lang)}</p>
          </div>
        </div>
        <DeliveryRatingSection orderId={orderId} reviewerId={buyerId} reviewerRole="buyer" />
      </div>
    </section>
  )
}
