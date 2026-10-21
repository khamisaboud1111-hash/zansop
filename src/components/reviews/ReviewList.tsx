'use client'

import { Star, MessageSquare } from 'lucide-react'
import { StarRating } from '@/components/ui/StarRating'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

export interface ReviewEntry {
  id: string
  rating: number
  comment: string | null
  seller_reply: string | null
  created_at: string
  authorName: string
  authorAvatar?: string | null
  /** Shown above the comment, e.g. the product name on a seller review list. */
  subject?: string | null
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function ReviewSummary({ average, count }: { average: number; count: number }) {
  const lang = useLangStore((s) => s.lang)

  if (count === 0) return null

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`w-4 h-4 ${n <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-foreground">{average.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({count} {t('reviews', lang)})
      </span>
    </div>
  )
}

export function ReviewList({ entries, emptyText }: { entries: ReviewEntry[]; emptyText?: string }) {
  const lang = useLangStore((s) => s.lang)

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyText ?? t('noReviewsPrompt', lang)}
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
              {entry.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (entry.authorName || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-sm text-foreground">{entry.authorName}</p>
                <StarRating value={entry.rating} readonly size="sm" />
                <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
              </div>
              {entry.subject && (
                <p className="text-xs text-muted-foreground mt-0.5">{entry.subject}</p>
              )}
              {entry.comment && (
                <p className="text-sm text-foreground mt-2 whitespace-pre-wrap leading-relaxed">{entry.comment}</p>
              )}
              {entry.seller_reply && (
                <div className="mt-3 ml-0 border-l-2 border-brand-500/40 pl-3">
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t('sellerReply', lang)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entry.seller_reply}</p>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
