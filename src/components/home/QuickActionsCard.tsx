'use client'

import Link from 'next/link'
import { LayoutGrid, Map, PackageSearch, Tag } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

// Floats over the bottom edge of the Hero photo, like the reference design —
// deliberately a plain white card (see .quick-action-tile in globals.css for
// why it has no dark: variants).
export default function QuickActionsCard() {
  const lang = useLangStore((s) => s.lang)
  return (
    <div className="page-container relative z-20 -mt-10 sm:-mt-12">
      <div className="bg-white rounded-2xl shadow-modal border border-ink-100 p-4 sm:p-5 grid grid-cols-4 gap-1 sm:gap-4">
        <Link href="/search" className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">{t('categories', lang)}</span>
        </Link>

        {/* Map opens as a full page so users can explore all of Zanzibar. */}
        <Link href="/map" className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">{t('map', lang)}</span>
        </Link>

        <Link href="/orders" className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <PackageSearch className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">{t('order', lang)}</span>
        </Link>

        <Link href="/search?on_sale=true" className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">{t('offers', lang)}</span>
        </Link>
      </div>
    </div>
  )
}

