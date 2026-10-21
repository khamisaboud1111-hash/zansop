'use client'

import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import { useMySellerReviews } from '@/hooks/useSellerReviews'
import SellerReviewReply from '@/components/reviews/SellerReviewReply'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

export default function SellerReviewsInbox() {
  const lang = useLangStore((s) => s.lang)
  const { reviews, loading, refetch } = useMySellerReviews()
  const [filter, setFilter] = useState<'all' | 'unanswered'>('all')

  const shown = useMemo(
    () => (filter === 'unanswered' ? reviews.filter((r) => !r.seller_reply) : reviews),
    [reviews, filter]
  )

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading', lang)}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            filter === 'all'
              ? 'bg-brand-500 text-white'
              : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
          }`}
        >
          {t('allReviews', lang)} ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('unanswered')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            filter === 'unanswered'
              ? 'bg-brand-500 text-white'
              : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'
          }`}
        >
          {t('unanswered', lang)} ({reviews.filter((r) => !r.seller_reply).length})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noSellerReviewsYet', lang)}</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((review) => (
            <li key={review.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(review.buyer?.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">
                      {review.buyer?.full_name ?? 'Mteja'}
                    </p>
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{review.comment}</p>
                  )}
                  {review.seller_reply && (
                    <div className="mt-2 border-l-2 border-brand-500/40 pl-3">
                      <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                        {t('sellerReply', lang)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">{review.seller_reply}</p>
                    </div>
                  )}
                  <SellerReviewReply review={review} onReplied={refetch} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
