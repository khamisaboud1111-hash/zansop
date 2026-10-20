'use client'

import Image from 'next/image'
import { Star, MapPin, Truck, Shield, Store, MessageCircle, ArrowUpRight, Check } from 'lucide-react'
import { cn } from '@/utils'
import { t } from '@/i18n/translations'
import { useLangStore } from '@/store'
import { useRouter } from 'next/navigation'
import type { Seller } from '@/types'

interface SellerCardProps {
  seller: Seller
}

export default function SellerCard({ seller }: SellerCardProps) {
  const { lang } = useLangStore()
  const router = useRouter()

  const logoUrl = seller.logo_url
  const bannerUrl = seller.banner_url
  const isVerified = seller.national_id_verified || seller.business_license_verified

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    router.push(`/sellers/${seller.store_slug}`)
  }

  return (
    <div className="card bg-card border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col" onClick={handleClick}>
      <div className="relative aspect-video overflow-hidden bg-muted">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={`${seller.store_name} banner`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Store className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {seller.is_featured && (
            <span className="badge bg-amber-500 text-white text-xs">
              <Star className="w-3 h-3 mr-1" /> {t('featured', 'sw')}
            </span>
          )}
          {isVerified && (
            <span className="badge bg-brand-500 text-white text-xs">
              <Shield className="w-3 h-3 mr-1" /> {t('verified', 'sw')}
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span className="badge bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs">
            <Star className="w-3 h-3 mr-1 fill-current text-amber-400" />
            {seller.rating?.toFixed(1) ?? '0.0'}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          {seller.logo_url ? (
            <Image
              src={seller.logo_url}
              alt={`${seller.store_name} logo`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center ring-2 ring-brand-500/20">
              <span className="text-brand-600 dark:text-brand-400 font-bold text-xl">
                {seller.store_name?.charAt(0).toUpperCase() ?? 'D'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-ink-900 dark:text-white truncate">
              {seller.store_name}
            </h3>
            {seller.location && (
              <p className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {seller.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400 mb-3">
          {seller.rating && seller.review_count > 0 && (
            <span className="flex items-center gap-0.5 text-ink-600 dark:text-ink-300">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{seller.rating.toFixed(1)}</span>
              <span className="text-ink-400">({seller.review_count})</span>
            </span>
          )}
          {seller.total_sales && (
            <span className="flex items-center gap-0.5 text-ink-500 dark:text-ink-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>{seller.total_sales.toLocaleString()} {t('sales', 'sw')}</span>
            </span>
          )}
        </div>

        {seller.whatsapp_number && (
          <a href={`https://wa.me/${seller.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors w-full justify-center text-sm font-medium" onClick={(e) => e.stopPropagation()}>
            <MessageCircle className="w-4 h-4" />
            {t('chatOnWhatsApp', 'sw')}
          </a>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <div className="flex-1 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
            {seller.delivery_available && (
              <span className="flex items-center gap-0.5">
                <Truck className="w-3 h-3" />
                {t('deliveryAvailable', 'sw')}
              </span>
            )}
            {seller.pickup_available && (
              <span className="flex items-center gap-0.5">
                <Check className="w-3 h-3" />
                {t('pickupAvailable', 'sw')}
              </span>
            )}
          </div>
          <button onClick={handleClick} className="ml-auto btn-secondary text-xs py-1.5 px-3">
            {t('visitStore', 'sw')}
          </button>
        </div>
      </div>
    </div>
  )
}

