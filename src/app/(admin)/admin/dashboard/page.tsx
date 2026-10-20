'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Store, Package, ShoppingBag, DollarSign, AlertCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatCard, PageLoader } from '@/components/ui'
import { OrderStatusBadge, SellerStatusBadge } from '@/components/ui/Badge'
import { formatTZS, formatDate } from '@/utils'
import toast from 'react-hot-toast'
import type { Order, Seller } from '@/types'

interface RecentOrder {
  id: string
  status: string
  total_amount: number
  created_at: string
  buyer?: { full_name: string } | null
  items?: { product?: { name: string } | null }[]
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const [stats, setStats] = useState<{
    totalSellers: number
    pendingSellers: number
    totalProducts: number
    pendingProducts: number
    totalOrders: number
    totalRevenue: number
    totalCommissions: number
    unpaidCommissions: number
  } | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [pendingSellersList, setPendingSellersList] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        sellersRes, pendingSellersRes, productsRes, pendingProductsRes,
        ordersRes, commissionsRes, recentOrdersRes, pendingSellersListRes,
      ] = await Promise.all([
        supabase.from('sellers').select('id', { count: 'exact', head: true }),
        supabase.from('sellers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('orders').select('total_amount'),
        supabase.from('commissions').select('commission_amount, is_paid'),
        supabase.from('orders').select('*, buyer:profiles(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('sellers').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ])

      const orders = ordersRes.data ?? []
      const commissions = commissionsRes.data ?? []

      if (sellersRes.error) console.error('Failed to load sellers:', sellersRes.error.message)
      if (productsRes.error) console.error('Failed to load products:', productsRes.error.message)
      if (ordersRes.error) console.error('Failed to load orders:', ordersRes.error.message)
      if (commissionsRes.error) console.error('Failed to load commissions:', commissionsRes.error.message)
      if (recentOrdersRes.error) console.error('Failed to load recent orders:', recentOrdersRes.error.message)

      setStats({
        totalSellers: sellersRes.count ?? 0,
        pendingSellers: pendingSellersRes.count ?? 0,
        totalProducts: productsRes.count ?? 0,
        pendingProducts: pendingProductsRes.count ?? 0,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s: number, o: { total_amount: number }) => s + o.total_amount, 0),
        totalCommissions: commissions.reduce((s: number, c: { commission_amount: number }) => s + c.commission_amount, 0),
        unpaidCommissions: commissions.filter((c: { is_paid: boolean }) => !c.is_paid).reduce((s: number, c: { commission_amount: number }) => s + c.commission_amount, 0),
      })

      setRecentOrders(recentOrdersRes.data ?? [])
      setPendingSellersList(pendingSellersListRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-6">Dashibodi ya Msimamizi</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Wauuzaji Wote" value={stats?.totalSellers ?? 0} icon={<Store className="w-5 h-5" />} accent="brand" />
        <StatCard label="Bidhaa Zote" value={stats?.totalProducts ?? 0} icon={<Package className="w-5 h-5" />} accent="spice" />
        <StatCard label="Maagizo Yote" value={stats?.totalOrders ?? 0} icon={<ShoppingBag className="w-5 h-5" />} accent="gold" />
        <StatCard label="Mapato Yote" value={formatTZS(stats?.totalRevenue ?? 0)} icon={<DollarSign className="w-5 h-5" />} accent="green" />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {(stats?.pendingSellers ?? 0) > 0 && (
          <Link href="/admin/sellers" className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>{stats?.pendingSellers}</strong> wauuzaji wanasubiri idhini</p>
          </Link>
        )}
        {(stats?.pendingProducts ?? 0) > 0 && (
          <Link href="/admin/products" className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-800"><strong>{stats?.pendingProducts}</strong> bidhaa kwenye rasimu</p>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending sellers */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800">Wauuzaji Wanaosubiri</h2>
            <Link href="/admin/sellers" className="text-xs text-brand-600 font-medium">Wote →</Link>
          </div>
          {pendingSellersList.length === 0 ? (
            <p className="text-sm text-ink-400 py-4 text-center">Hakuna anayesubiri</p>
          ) : (
            <div className="space-y-2">
              {pendingSellersList.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-ink-50">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{s.store_name}</p>
                    <p className="text-xs text-ink-400">{formatDate(s.created_at)}</p>
                  </div>
                  <SellerStatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800">Maagizo ya Hivi Karibuni</h2>
            <Link href="/admin/orders" className="text-xs text-brand-600 font-medium">Yote →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-400 py-4 text-center">Bado hakuna maagizo</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-ink-50">
                  <div>
                    <p className="text-sm font-medium text-ink-800">#{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-ink-400">{o.buyer?.full_name} · {formatTZS(o.total_amount)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

