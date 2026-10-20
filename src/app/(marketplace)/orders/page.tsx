'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronRight } from 'lucide-react'
import { useBuyerOrders } from '@/hooks/useOrders'
import { useUser } from '@/hooks/useUser'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatTZS, formatDate } from '@/utils'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { PageLoader, EmptyState } from '@/components/ui'
import { Skeleton } from '@/components/shared/SkeletonComposites'
import { PageHeader } from '@/components/shared/PageHeader'

export default function OrdersPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useUser()
  const { orders, loading } = useBuyerOrders()
  const lang = useLangStore((s) => s.lang)

  if (authLoading) return <PageLoader />
  if (!profile) { router.push('/login'); return null }

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8 max-w-2xl">
        <PageHeader title={t('orders', lang)} className="mb-6" />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title={t('noOrders', lang)}
            description={t('noOrdersDesc', lang)}
            action={<Link href="/products" className="btn-primary">{t('startShopping', lang)}</Link>}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const firstItem = order.items?.[0]
              const img = firstItem?.product?.images?.find((i: any) => i.is_primary) ?? firstItem?.product?.images?.[0]
              const extraCount = (order.items?.length ?? 1) - 1

              return (
                <Link key={order.id} href={`/orders/${order.id}`}
                  className="bg-card border border-border p-4 flex items-center gap-3 hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {img ? (
                      <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <Package className="absolute inset-0 m-auto w-6 h-6 text-ink-300 dark:text-ink-600" />
                    )}
                    {extraCount > 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+{extraCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {firstItem?.product?.name ?? t('product', lang)}
                          {extraCount > 0 && <span className="text-muted-foreground"> +{extraCount} {t('more', lang)}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-bold text-sm text-foreground">{formatTZS(order.total_amount)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

function OrderSkeleton() {
  return (
    <div className="bg-card border border-border p-4 flex items-center gap-3">
      <Skeleton className="w-14 h-14 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

