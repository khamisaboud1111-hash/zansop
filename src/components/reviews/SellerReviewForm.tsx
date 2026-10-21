'use client'

import { useState } from 'react'
import { CheckCircle2, Store } from 'lucide-react'
import toast from 'react-hot-toast'
import { StarRating } from '@/components/ui/StarRating'
import { submitSellerReview, useMySellerReview } from '@/hooks/useSellerReviews'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface SellerReviewFormProps {
  orderId: string
  sellerId: string
  sellerName: string
  onSubmitted?: () => void
}

/**
 * Lets a buyer rate and comment on a seller for a delivered order. One
 * review per order per seller - the database enforces that too.
 */
export default function SellerReviewForm({ orderId, sellerId, sellerName, onSubmitted }: SellerReviewFormProps) {
  const lang = useLangStore((s) => s.lang)
  const { review, loading, refetch } = useMySellerReview(orderId, sellerId)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      toast.error(t('selectRating', lang))
      return
    }
    setSubmitting(true)
    const { error } = await submitSellerReview({ orderId, sellerId, rating, comment })
    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }
    toast.success(t('thanksForReview', lang))
    await refetch()
    onSubmitted?.()
  }

  if (loading) return null

  if (review) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('yourSellerReview', lang)}</p>
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

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center flex-shrink-0">
          <Store className="w-4.5 h-4.5 text-brand-600 dark:text-brand-300" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{t('rateThisSeller', lang)}</p>
          <p className="text-xs text-muted-foreground">{sellerName}</p>
        </div>
      </div>

      <div>
        <label className="label">{t('rating', lang)}</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="label">{t('reviewOptional', lang)}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          className="input resize-none"
          placeholder={t('sellerReviewPlaceholder', lang)}
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? t('submittingLabel', lang) : t('submitReview', lang)}
      </button>
    </form>
  )
}
