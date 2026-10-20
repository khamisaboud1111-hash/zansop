'use client'

import { ShieldCheck, Award, Star, TrendingUp } from 'lucide-react'
import { cn } from '@/utils'
import type { Seller } from '@/types'
import type { Language } from '@/i18n/translations'
import { t } from '@/i18n/translations'
import { useLangStore } from '@/store'

interface SellerVerificationBadgeProps {
  seller: Pick<Seller, 'is_featured' | 'verified_at' | 'average_rating' | 'review_count' | 'total_sales' | 'status'>
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  lang?: Language
}

export function SellerVerificationBadge({ 
  seller, 
  size = 'md', 
  showDetails = false,
  lang 
}: SellerVerificationBadgeProps) {
  const storeLang = useLangStore((s) => s.lang)
  const displayLang = lang || storeLang

  const sizeClasses = {
    sm: { badge: 'px-2 py-1 gap-1', icon: 'w-3 h-3', text: 'text-xs' },
    md: { badge: 'px-3 py-1.5 gap-2', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { badge: 'px-4 py-2 gap-2.5', icon: 'w-5 h-5', text: 'text-base' },
  }

  const s = sizeClasses[size]

  const isVerified = seller.status === 'approved' && seller.verified_at
  const isFeatured = seller.is_featured
  const hasGoodRating = seller.average_rating >= 4.5 && seller.review_count >= 10
  const isTopSeller = seller.total_sales >= 100

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Verified Badge */}
      {isVerified && (
        <span className={cn(
          'inline-flex items-center font-semibold rounded-full border',
          s.badge,
          'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
        )}>
          <ShieldCheck className={cn(s.icon, 'flex-shrink-0')} />
          <span className={s.text}>{displayLang === 'sw' ? 'Imehakikishwa' : 'Verified'}</span>
        </span>
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <span className={cn(
          'inline-flex items-center font-semibold rounded-full border',
          s.badge,
          'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
        )}>
          <Award className={cn(s.icon, 'flex-shrink-0')} />
          <span className={s.text}>{displayLang === 'sw' ? 'Kipekee' : 'Featured'}</span>
        </span>
      )}

      {/* Top Rated Badge */}
      {hasGoodRating && (
        <span className={cn(
          'inline-flex items-center font-semibold rounded-full border',
          s.badge,
          'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400'
        )}>
          <Star className={cn(s.icon, 'flex-shrink-0 fill-current')} />
          <span className={s.text}>
            {displayLang === 'sw' ? 'Ulisemewa' : 'Top Rated'}
            {seller.average_rating > 0 && ` ${seller.average_rating.toFixed(1)}`}
          </span>
        </span>
      )}

      {/* Top Seller Badge */}
      {isTopSeller && (
        <span className={cn(
          'inline-flex items-center font-semibold rounded-full border',
          s.badge,
          'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
        )}>
          <TrendingUp className={cn(s.icon, 'flex-shrink-0')} />
          <span className={s.text}>
            {displayLang === 'sw' ? 'Muuzaji Bora' : 'Top Seller'}
          </span>
        </span>
      )}

      {/* Details */}
      {showDetails && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600 dark:text-ink-400 mt-2 pt-2 border-t border-ink-100 dark:border-ink-800">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {seller.average_rating.toFixed(1)} · {seller.review_count} {displayLang === 'sw' ? 'maoni' : 'reviews'}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {seller.total_sales} {displayLang === 'sw' ? 'mauzo' : 'sales'}
          </span>
        </div>
      )}
    </div>
  )
}

// Compact inline version for product cards
export function SellerVerificationInline({ 
  seller, 
  lang 
}: { 
  seller: Pick<Seller, 'is_featured' | 'verified_at' | 'average_rating' | 'status'>
  lang?: Language 
}) {
  const storeLang = useLangStore((s) => s.lang)
  const displayLang = lang || storeLang

  const isVerified = seller.status === 'approved' && seller.verified_at
  const isFeatured = seller.is_featured

  if (!isVerified && !isFeatured) return null

  return (
    <div className="inline-flex items-center gap-1">
      {isVerified && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
          {displayLang === 'sw' ? '✓' : '✓'}
        </span>
      )}
      {isFeatured && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-200 dark:border-amber-800">
          <Award className="w-2.5 h-2.5 mr-0.5" />
          ★
        </span>
      )}
    </div>
  )
}

