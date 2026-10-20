'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import ProductCard from '@/components/product/ProductCard'
import { PageLoader, EmptyState } from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { SkeletonGrid } from '@/components/shared/SkeletonComposites'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import type { WishlistItem } from '@/types'

export default function WishlistPage() {
  const { profile, loading: authLoading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('wishlists')
          .select(`*, product:products(*, seller:sellers(store_name, status, national_id_verified), images:product_images(*))`)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
        if (error) {
          console.error('Failed to load wishlist:', error.message)
        }
        setItems(data ?? [])
      } catch (err) {
        console.error('Wishlist fetch failed:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [profile])

  if (authLoading) return <PageLoader />
  if (!profile) return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8">
        <PageHeader title={<span className="flex items-center gap-3"><Heart className="w-6 h-6 text-red-400 fill-red-400" />{t('savedItems', lang)}</span>} className="mb-6" />
        <EmptyState
          icon={<Heart className="w-10 h-10" />}
          title={t('loginToViewWishlist', lang)}
          action={<Link href="/login" className="btn-primary">{t('login', lang)}</Link>}
        />
      </div>
    </main>
  )

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8">
        <PageHeader
          title={<span className="flex items-center gap-3"><Heart className="w-6 h-6 text-red-400 fill-red-400" />{t('savedItems', lang)}</span>}
          subtitle={<span className="text-muted-foreground">{items.length} {t('items', lang)}</span>}
          className="mb-6"
        />

        {loading ? (
          <SkeletonGrid count={8} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-10 h-10" />}
            title={t('emptyWishlist', lang)}
            description={t('emptyWishlistDesc', lang)}
            action={<Link href="/search" className="btn-primary">{t('searchProducts', lang)}</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => item.product && (
              <ProductCard key={item.id} product={item.product as any} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

