'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, CheckCheck, Trash2, Image as ImageIcon, Video as VideoIcon, Star, ShoppingCart, ShieldCheck, User, AlertCircle, Globe, Package as PackageIcon, Truck as TruckIcon, PackageCheck as PackageCheckIcon, XCircle as XCircleIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useSeller } from '@/hooks/useSeller'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatDate } from '@/utils'
import { cn } from '@/utils'

interface SellerNotification {
  id: string
  user_id: string
  title_en: string
  title_sw: string
  body_en: string
  body_sw: string
  type: string
  is_read: boolean
  created_at: string
  metadata?: any
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  order_placed: { label: 'New Order', icon: ShoppingCart, color: 'bg-brand-100 text-brand-600' },
  order_confirmed: { label: 'Order Confirmed', icon: CheckCheck, color: 'bg-emerald-100 text-emerald-600' },
  order_packed: { label: 'Order Packed', icon: PackageIcon, color: 'bg-purple-100 text-purple-600' },
  order_out_for_delivery: { label: 'Out for Delivery', icon: TruckIcon, color: 'bg-indigo-100 text-indigo-600' },
  order_delivered: { label: 'Order Delivered', icon: PackageCheckIcon, color: 'bg-emerald-100 text-emerald-600' },
  order_cancelled: { label: 'Order Cancelled', icon: XCircleIcon, color: 'bg-red-100 text-red-600' },
  new_review: { label: 'New Review', icon: Star, color: 'bg-amber-100 text-amber-600' },
  like_product: { label: 'Product Liked', icon: ImageIcon as any, color: 'bg-rose-100 text-rose-600' },
  like_reel: { label: 'Reel Liked', icon: VideoIcon as any, color: 'bg-blue-100 text-blue-600' },
  new_follower: { label: 'New Follower', icon: User, color: 'bg-blue-100 text-blue-600' },
  seller_approved: { label: 'Store Approved', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-600' },
  seller_suspended: { label: 'Store Suspended', icon: AlertCircle as any, color: 'bg-red-100 text-red-600' },
  system: { label: 'Platform Update', icon: Globe, color: 'bg-ink-100 text-ink-600' },
}

export default function SellerNotificationsPage() {
  const { profile, loading: authLoading } = useUser()
  const { seller, loading: sellerLoading } = useSeller()
  const supabase = useEffect instanceof Function ? null : null
  const [notifications, setNotifications] = useState<SellerNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let supabase: any
    let channel: any

    async function load() {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        setNotifications((data ?? []) as SellerNotification[])
      } catch (err) {
        console.error('Notifications load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()

    // Realtime for new notifications
    const { data: { user } } = { data: {} as any }
    // We'll set up channel after getting user
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      channel = supabase
        .channel(`seller-notifications-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload: any) => {
          const n = payload.new as SellerNotification
          setNotifications((prev) => [n, ...prev])
        })
        .subscribe()

      return () => {
        if (channel) supabase.removeChannel(channel)
      }
    })()
  }, [])

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  async function deleteNotification(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (authLoading || sellerLoading || loading) return <PageLoader />

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} ${unreadCount === 1 ? 'new notification' : 'new notifications'}` : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline"
              >
                <CheckCheck className="w-4 h-4" /> Mark all as read
              </button>
            )}
            <Link href="/seller/dashboard" className="text-sm text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-ink-400" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">No notifications yet</h3>
            <p className="text-ink-500 dark:text-ink-400 max-w-xs mx-auto">
              When you get likes on your products or reels, new orders, or platform updates, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || { label: 'Notification', icon: Bell, color: 'bg-ink-100 text-ink-600' }
              const lang = 'en' // Could read from store, defaulting to en
              const title = lang === 'sw' ? n.title_sw : n.title_en
              const body = lang === 'sw' ? n.body_sw : n.body_en
              const typeLabel = config.label

              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'group cursor-pointer bg-card border border-border rounded-2xl p-4 transition-colors',
                    !n.is_read ? 'bg-brand-50 dark:bg-brand-950/20 border-brand-100 dark:border-brand-900/40 hover:bg-brand-100/50 dark:hover:bg-brand-900/30' : 'hover:bg-muted dark:hover:bg-ink-800/50'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0', config.color)}>
                    <config.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn('text-sm font-semibold text-ink-900 dark:text-white', !n.is_read && 'font-bold')}>
                        {title}
                      </p>
                      <span className="text-[10px] font-medium text-ink-400 dark:text-ink-500 uppercase tracking-wider">
                        {typeLabel}
                      </span>
                    </div>
                    <p className="text-sm text-ink-600 dark:text-ink-300 line-clamp-2 mb-1">
                      {body}
                    </p>
                    <p className="text-xs text-ink-400 dark:text-ink-500">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                    className="text-ink-300 dark:text-ink-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
