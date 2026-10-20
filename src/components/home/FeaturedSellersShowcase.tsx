'use client'

import Link from 'next/link'
import { BadgeCheck, MapPin, Package, ShoppingBag, Star, Store } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface FeaturedSeller {
  id: string
  store_name: string
  store_slug: string
  logo_url: string | null
  banner_url: string | null
  average_rating: number
  review_count: number
  total_sales: number
  location_area: string | null
  location_label: string | null
  national_id_verified: boolean
  product_count?: number
}

function getStoreInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() || 'S'
}

function getStoreColor(name: string): string {
  const colors = [
    'from-brand-500 to-brand-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-orange-500',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-rose-600',
    'from-sky-500 to-blue-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % 6]
}

export default function FeaturedSellersShowcase({ sellers }: { sellers: FeaturedSeller[] }) {
  const lang = useLangStore((s) => s.lang)

  if (sellers.length === 0) {
    return (
      <section className="section bg-ink-50/50 dark:bg-ink-900/40">
        <div className="page-container text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">{t('popularStores', lang)}</h2>
          <p className="text-sm text-ink-500 dark:text-ink-300 mb-5 max-w-sm mx-auto">{t('featuredSellersEmpty', lang)}</p>
          <Link
            href="/register?type=seller"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl text-sm hover:bg-brand-600 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            <Store className="w-4 h-4" /> {t('openStore', lang)}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section bg-ink-50/50 dark:bg-ink-900/40">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">{t('popularStores', lang)}</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300">{t('featuredSellersSubtitle', lang)}</p>
          </div>
          <Link href="/search?type=sellers" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">
            {t('seeAll', lang)} �+
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/sellers/${seller.store_slug}`}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card hover:shadow-card-hover transition-shadow"
            >
              {/* Banner - CSS gradient instead of image */}
              <div className={`relative h-24 ${getStoreColor(seller.store_name)}`} />

              <div className="p-4 -mt-8 relative">
                {/* Logo - CSS gradient with initial instead of image */}
                <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-ink-900 bg-white dark:bg-ink-900 shadow-card overflow-hidden mb-2">
                  <div className={`w-full h-full ${getStoreColor(seller.store_name)} flex items-center justify-center`}>
                    <span className="text-white font-bold text-xl">{getStoreInitial(seller.store_name)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-bold text-ink-900 dark:text-white text-sm line-clamp-1">{seller.store_name}</h3>
                  {seller.national_id_verified && (
                    <BadgeCheck className="w-4 h-4 text-brand-500 flex-shrink-0" aria-label={t('verifiedBadge', lang)} />
                  )}
                </div>

                {(seller.location_label || seller.location_area) && (
                  <p className="flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400 mb-2">
                    <MapPin className="w-3 h-3" /> {seller.location_label || seller.location_area}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-ink-600 dark:text-ink-300">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {seller.average_rating?.toFixed(1) ?? '0.0'}
                    <span className="text-ink-400">({seller.review_count})</span>
                  </span>
                  {typeof seller.product_count === 'number' && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> {seller.product_count}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> {seller.total_sales}
                  </span>
                </div>

                <span className="mt-3 inline-flex w-full justify-center items-center gap-1 py-2 rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 text-xs font-semibold group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  {t('visitStore', lang)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

