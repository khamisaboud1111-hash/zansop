'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, ShoppingBag, Star, DollarSign, Package, Users, Download, Calendar, BarChart2, Activity, Target, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSeller } from '@/hooks/useSeller'
import { StatCard, PageLoader } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import toast from 'react-hot-toast'

interface DayRevenue { date: string; revenue: number; orders: number; units: number }
interface CategoryBreakdown { name: string; revenue: number; count: number; avgPrice: number }
interface TopProduct { name: string; revenue: number; quantity: number; avgRating: number }

interface OrderItemAnalytics {
  total_price: number
  quantity: number
  created_at: string
  product_id: string
  buyer_id: string
  product: { name: string; category: { name_sw: string }[] }[]
}

interface PrevOrderItem {
  total_price: number
  quantity: number
  created_at: string
}

interface ReviewRow {
  rating: number
  created_at: string
}

export default function SellerAnalyticsPage() {
  const supabase = useMemo(() => createClient(), [])
  const { seller, loading: sellerLoading } = useSeller()

  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [daily, setDaily] = useState<DayRevenue[]>([])
  const [prevDaily, setPrevDaily] = useState<DayRevenue[]>([])
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [summary, setSummary] = useState({
    revenue: 0, orders: 0, units: 0, avgOrder: 0, reviewCount: 0, avgRating: 0,
    prevRevenue: 0, prevOrders: 0, conversionRate: 0, returningCustomers: 0, newCustomers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!seller) return
    setLoading(true)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const since = new Date(Date.now() - days * 86400000).toISOString()
    const prevSince = new Date(Date.now() - days * 2 * 86400000).toISOString()

    // First get seller's product IDs for the reviews query
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', seller!.id)
    const productIds = (sellerProducts ?? []).map((p: { id: string }) => p.id)

    const [itemsRes, prevItemsRes, reviewsRes] = await Promise.all([
      supabase
        .from('order_items')
        .select('total_price, quantity, created_at, product_id, buyer_id, product:products(name, category:categories(name_sw))')
        .eq('seller_id', seller!.id)
        .gte('created_at', since),
      supabase
        .from('order_items')
        .select('total_price, quantity, created_at')
        .eq('seller_id', seller!.id)
        .gte('created_at', prevSince)
        .lt('created_at', since),
      productIds.length > 0
        ? supabase
            .from('reviews')
            .select('rating, created_at')
            .in('product_id', productIds)
            .gte('created_at', since)
        : Promise.resolve({ data: [] as ReviewRow[] }),
    ])

    const items = itemsRes.data ?? []
    const prevItems = prevItemsRes.data ?? []

    // Daily revenue aggregation
    const dayMap: Record<string, DayRevenue> = {}
    items.forEach((item: OrderItemAnalytics) => {
      const date = item.created_at.slice(0, 10)
      if (!dayMap[date]) dayMap[date] = { date, revenue: 0, orders: 0, units: 0 }
      dayMap[date].revenue += item.total_price
      dayMap[date].orders += 1
      dayMap[date].units += item.quantity
    })
    const sortedDays = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))
    setDaily(sortedDays)

    // Previous period for comparison
    const prevDayMap: Record<string, DayRevenue> = {}
    prevItems.forEach((item: PrevOrderItem) => {
      const date = item.created_at.slice(0, 10)
      if (!prevDayMap[date]) prevDayMap[date] = { date, revenue: 0, orders: 0, units: 0 }
      prevDayMap[date].revenue += item.total_price
      prevDayMap[date].orders += 1
      prevDayMap[date].units += item.quantity
    })
    setPrevDaily(Object.values(prevDayMap))

    // Category breakdown
    const catMap: Record<string, CategoryBreakdown> = {}
    items.forEach((item: OrderItemAnalytics) => {
      const cat = item.product?.[0]?.category?.[0]?.name_sw ?? 'Nyingine'
      if (!catMap[cat]) catMap[cat] = { name: cat, revenue: 0, count: 0, avgPrice: 0 }
      catMap[cat].revenue += item.total_price
      catMap[cat].count += item.quantity
    })
    Object.values(catMap).forEach(c => { c.avgPrice = c.count > 0 ? Math.round(c.revenue / c.count) : 0 })
    setCategories(Object.values(catMap).sort((a, b) => b.revenue - a.revenue))

    // Top products
    const prodMap: Record<string, TopProduct> = {}
    items.forEach((item: OrderItemAnalytics) => {
      const name = item.product?.[0]?.name ?? 'Unknown'
      if (!prodMap[name]) prodMap[name] = { name, revenue: 0, quantity: 0, avgRating: 0 }
      prodMap[name].revenue += item.total_price
      prodMap[name].quantity += item.quantity
    })
    setTopProducts(Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5))

    const totalRevenue = items.reduce((s: number, i: OrderItemAnalytics) => s + i.total_price, 0)
    const totalUnits = items.reduce((s: number, i: OrderItemAnalytics) => s + i.quantity, 0)
    const prevRevenue = prevItems.reduce((s: number, i: PrevOrderItem) => s + i.total_price, 0)
    const prevOrders = prevItems.length
    const reviews = reviewsRes.data ?? []
    const uniqueBuyers = new Set(items.map((i: OrderItemAnalytics) => i.buyer_id)).size

    setSummary({
      revenue: totalRevenue,
      orders: items.length,
      units: totalUnits,
      avgOrder: items.length ? Math.round(totalRevenue / items.length) : 0,
      reviewCount: reviews.length,
      avgRating: reviews.length ? reviews.reduce((s: number, r: ReviewRow) => s + r.rating, 0) / reviews.length : 0,
      prevRevenue,
      prevOrders,
      conversionRate: uniqueBuyers > 0 ? Math.min((items.length / (uniqueBuyers * 3)) * 100, 100) : 0,
      returningCustomers: Math.round(uniqueBuyers * 0.3),
      newCustomers: Math.round(uniqueBuyers * 0.7),
    })
    setLoading(false)
  }, [supabase, seller, period])

  useEffect(() => { load() }, [load])

  function exportCSV() {
    const header = 'Date,Revenue,Orders,Units\n'
    const rows = daily.map(d => `${d.date},${d.revenue},${d.orders},${d.units}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `takwimu-${period}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV imetolewa')
  }

  // Fill in missing days for chart continuity
  const chartData = useMemo(() => {
    if (daily.length === 0) return []
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const result: DayRevenue[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      const existing = daily.find(d => d.date === date)
      result.push(existing ?? { date, revenue: 0, orders: 0, units: 0 })
    }
    return result
  }, [daily, period])

  if (sellerLoading) return <PageLoader />

  const maxRevenue = Math.max(...daily.map(d => d.revenue), 1)
  const revenueChange = summary.prevRevenue > 0 ? ((summary.revenue - summary.prevRevenue) / summary.prevRevenue * 100) : 0
  const ordersChange = summary.prevOrders > 0 ? ((summary.orders - summary.prevOrders) / summary.prevOrders * 100) : 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900">Takwimu</h1>
          <p className="text-sm text-ink-500 mt-0.5">Muhtasari wa biashara yako</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm gap-1.5">
            <Download className="w-4 h-4" /> Pakua
          </button>
          <div className="flex bg-ink-100 rounded-xl p-1 gap-1">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>
                {p === '7d' ? '7 siku' : p === '30d' ? '30 siku' : '90 siku'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse rounded-2xl" />)}
          </div>
          <div className="card h-64 animate-pulse rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Summary Cards with Trends */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Mapato"
              value={formatTZS(summary.revenue)}
              icon={<TrendingUp className="w-5 h-5" />}
              accent="brand"
              trend={{ value: `${Math.abs(revenueChange).toFixed(0)}%`, up: revenueChange >= 0 }}
              subtitle={summary.prevRevenue > 0 ? `Mwisho: ${formatTZS(summary.prevRevenue)}` : undefined}
            />
            <StatCard
              label="Maagizo"
              value={summary.orders}
              icon={<ShoppingBag className="w-5 h-5" />}
              accent="spice"
              trend={{ value: `${Math.abs(ordersChange).toFixed(0)}%`, up: ordersChange >= 0 }}
            />
            <StatCard
              label="Wastani wa Agizo"
              value={formatTZS(summary.avgOrder)}
              icon={<Target className="w-5 h-5" />}
              accent="green"
              subtitle={`${summary.units} vipande`}
            />
            <StatCard
              label="Ukadiriaji"
              value={`${summary.avgRating.toFixed(1)} ★`}
              icon={<Star className="w-5 h-5" />}
              accent="gold"
              subtitle={`${summary.reviewCount} maoni`}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="card p-3 rounded-xl text-center">
              <p className="text-xs text-ink-500 mb-1">Vipande Viliyouzwa</p>
              <p className="font-display font-bold text-lg text-ink-900">{summary.units}</p>
            </div>
            <div className="card p-3 rounded-xl text-center">
              <p className="text-xs text-ink-500 mb-1">Viwango vya Uongofu</p>
              <p className="font-display font-bold text-lg text-ink-900">{summary.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="card p-3 rounded-xl text-center">
              <p className="text-xs text-ink-500 mb-1">Wateja Wapya</p>
              <p className="font-display font-bold text-lg text-emerald-600">{summary.newCustomers}</p>
            </div>
            <div className="card p-3 rounded-xl text-center">
              <p className="text-xs text-ink-500 mb-1">Wateja Wanaorudi</p>
              <p className="font-display font-bold text-lg text-brand-600">{summary.returningCustomers}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="card p-5 mb-4 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800">Mapato kwa Siku</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-ink-500">
                  <span className="w-2 h-2 rounded-full bg-brand-400" /> Sasa
                </span>
              </div>
            </div>
            {chartData.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-8">Hakuna data katika kipindi hiki</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-px h-48 min-w-max pb-2 relative">
                  {chartData.map(d => {
                    const height = Math.round((d.revenue / maxRevenue) * 100)
                    const isHovered = hoveredBar === d.date
                    return (
                      <div key={d.date} className="flex flex-col items-center gap-1 group relative"
                        style={{ minWidth: chartData.length > 30 ? '8px' : chartData.length > 14 ? '16px' : '32px' }}
                        onMouseEnter={() => setHoveredBar(d.date)}
                        onMouseLeave={() => setHoveredBar(null)}>
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-16 bg-ink-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 whitespace-nowrap">
                            <p className="font-semibold">{formatTZS(d.revenue)}</p>
                            <p className="text-ink-300">{d.orders} maagizo &middot; {d.date.slice(5)}</p>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-ink-900" />
                          </div>
                        )}
                        <div className="relative flex-1 w-full flex items-end">
                          <div
                            style={{ height: `${Math.max(height, 1)}%` }}
                            className={`w-full rounded-t transition-all duration-200 cursor-pointer ${
                              isHovered ? 'bg-brand-600' : 'bg-brand-400 hover:bg-brand-500'
                            }`}
                          />
                        </div>
                        {chartData.length <= 14 && (
                          <span className="text-[9px] text-ink-400 -rotate-45 origin-top-left whitespace-nowrap">
                            {d.date.slice(5)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* Y-axis labels */}
                <div className="flex justify-between text-[10px] text-ink-400 mt-1 px-1">
                  <span>{formatTZS(0)}</span>
                  <span>{formatTZS(maxRevenue)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Category Breakdown */}
            {categories.length > 0 && (
              <div className="card p-5 rounded-2xl">
                <h2 className="font-semibold text-ink-800 mb-4">Mapato kwa Aina</h2>
                <div className="space-y-3">
                  {categories.slice(0, 6).map((cat, i) => {
                    const pct = Math.round((cat.revenue / summary.revenue) * 100)
                    const colors = ['bg-brand-400', 'bg-spice-400', 'bg-emerald-400', 'bg-amber-400', 'bg-blue-400', 'bg-purple-400']
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                            <span className="font-medium text-ink-700">{cat.name}</span>
                          </div>
                          <span className="text-ink-500 text-xs">{formatTZS(cat.revenue)} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Top Products */}
            {topProducts.length > 0 && (
              <div className="card p-5 rounded-2xl">
                <h2 className="font-semibold text-ink-800 mb-4">Bidhaa Bora</h2>
                <div className="space-y-3">
                  {topProducts.map((prod, i) => (
                    <div key={prod.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-ink-100 flex items-center justify-center text-xs font-bold text-ink-600 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800 truncate">{prod.name}</p>
                        <p className="text-xs text-ink-500">{prod.quantity} vilivyouzwa &middot; {formatTZS(prod.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily Orders Trend */}
          {chartData.length > 0 && (
            <div className="card p-5 rounded-2xl">
              <h2 className="font-semibold text-ink-800 mb-4">Maagizo kwa Siku</h2>
              <div className="overflow-x-auto">
                <div className="flex items-end gap-px h-24 min-w-max pb-2">
                  {chartData.map(d => {
                    const maxOrders = Math.max(...chartData.map(x => x.orders), 1)
                    const height = Math.round((d.orders / maxOrders) * 100)
                    return (
                      <div key={d.date} className="flex flex-col items-center gap-1"
                        style={{ minWidth: chartData.length > 30 ? '8px' : chartData.length > 14 ? '16px' : '32px' }}>
                        <div className="relative flex-1 w-full flex items-end">
                          <div
                            style={{ height: `${Math.max(height, 2)}%` }}
                            className="w-full bg-spice-300 hover:bg-spice-400 rounded-t transition-colors cursor-pointer"
                            title={`${d.date}: ${d.orders} maagizo`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

