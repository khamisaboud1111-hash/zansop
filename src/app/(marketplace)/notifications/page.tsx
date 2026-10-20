'use client'

import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { useUser } from '@/hooks/useUser'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { formatDate } from '@/utils'
import { PageLoader, EmptyState } from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/utils'
import type { Notification } from '@/types'

const TYPE_ICONS: Record<string, string> = {
  order_placed: '🛒', order_confirmed: '✅', order_packed: '📦',
  order_out_for_delivery: '🚚', order_delivered: '🎉', order_cancelled: '❌',
  new_review: '⭐', seller_approved: '🏪', seller_suspended: '⛔',
  product_approved: '✅', product_rejected: '❌', low_stock: '⚠️', payment_received: '💰',
}

export default function NotificationsPage() {
  const { profile, loading: authLoading } = useUser()
  const { lang } = useLangStore()
  const { notifications, loading, markRead, markAllRead } = useNotifications()

  if (authLoading) return <PageLoader />
  if (!profile) return (
    <div className="page-container py-16 text-center">
      <Link href="/login" className="btn-primary inline-flex">{t('loginFirst', lang)}</Link>
    </div>
  )

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8 max-w-2xl">
        <PageHeader
          title={<span className="flex items-center gap-3"><Bell className="w-6 h-6 text-brand-500" />{t('notifications', lang)} {unread > 0 && <span className="text-base font-normal text-muted-foreground">({unread} {t('new', lang)})</span>}</span>}
          actions={unread > 0 ? (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline">
              <CheckCheck className="w-4 h-4" /> {t('markAllRead', lang)}
            </button>
          ) : undefined}
          className="mb-6"
        />

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-10 h-10" />}
            title={t('noNotifications', lang)}
            description={t('noNotificationsDesc', lang)}
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n: Notification) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={cn(
                  'bg-card border border-border rounded-2xl p-4 flex gap-3 transition-colors cursor-pointer',
                  !n.is_read ? 'bg-brand-50 dark:bg-brand-950/20 border-brand-100 dark:border-brand-900/40 hover:bg-brand-100/60 dark:hover:bg-brand-950/30' : 'hover:bg-muted'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0', !n.is_read ? 'bg-brand-100 dark:bg-brand-500/20' : 'bg-muted')}>
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug text-foreground', !n.is_read && 'font-semibold')}>
                    {lang === 'sw' ? n.title_sw : n.title_en}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {lang === 'sw' ? n.body_sw : n.body_en}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

