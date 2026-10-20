'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShoppingBag, TrendingUp, TrendingDown, Package, Star, AlertTriangle, Plus, DollarSign, Users, Wallet, Bell, MessageSquare, BarChart2, Activity, CreditCard, Clock, CheckCircle, XCircle, Archive, Layers, Percent, Settings, PackagePlus, UsersRound, Store, PackageCheck, PackageX, Clock4, Gauge, Sparkles, ArrowUpRight, ArrowDownRight, Minus, Target, TrendingUp as TrendingUpIcon, Truck, EyeOff } from 'lucide-react'
import { useSeller } from '@/hooks/useSeller'
import { StatCard, PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import { useDashboardStats } from '@/lib/query/hooks'
import { DismissibleAlert } from '@/components/shared/DismissibleAlert'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/hooks/useNotifications'

interface Alert {
  id: string
  type: 'warning' | 'info' | 'success'
  message: string
  action?: () => void
  actionLabel?: string
}

interface DashboardOrder {
  id: string
  total_amount: number
  status: string
  created_at: string
  buyer?: { full_name: string; email: string }
  delivery_address: string
  items?: any[]
}

export default function SellerDashboardPage() {
  const { seller, loading: sellerLoading } = useSeller()
  const { data: stats, isLoading, error, refetch } = useDashboardStats()
  const { unreadCount } = useNotifications()
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'warning' | 'info' | 'success'; message: string; action?: () => void; actionLabel?: string }>>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Load recent orders
  useEffect(() => {
    if (!seller) return
    setOrdersLoading(true)
    ;(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('orders')
          .select(`
            id, total_amount, status, created_at, delivery_address,
            buyer:profiles(full_name, email)
          `)
          .eq('seller_id', seller.id)
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentOrders((data ?? []) as DashboardOrder[])
      } catch {
        // Silent fail - orders are optional on dashboard
      } finally {
        setOrdersLoading(false)
      }
    })()
  }, [seller])

  // Load alerts when stats change
  useEffect(() => {
    if (!stats) return
    
    const newAlerts: Array<{ id: string; type: 'warning' | 'info' | 'success'; message: string; action?: () => void; actionLabel?: string }> = []
    
    if (stats.lowStockProducts > 0 && !dismissedAlerts.has('low-stock')) {
      newAlerts.push({
        id: 'low-stock',
        type: 'warning',
        message: `${stats.lowStockProducts} products are running low on stock (≤5 units)`,
        actionLabel: 'View Products',
        action: () => window.location.href = '/seller/products'
      })
    }
    
    if (stats.unpaidCommissions > 0 && !dismissedAlerts.has('commissions')) {
      newAlerts.push({
        id: 'commissions',
        type: 'warning',
        message: `$${stats.unpaidCommissions.toFixed(2)} in commissions are pending payout`,
        actionLabel: 'Pay Now',
        action: () => window.location.href = '/seller/wallet'
      })
    }
    
    if (stats.pendingOrders > 0 && !dismissedAlerts.has('orders')) {
      newAlerts.push({
        id: 'orders',
        type: 'info',
        message: `${stats.pendingOrders} orders are pending processing`,
        actionLabel: 'Process Orders',
        action: () => window.location.href = '/seller/orders'
      })
    }
    
    if (stats.totalRevenue < stats.recentRevenue * 0.8 && !dismissedAlerts.has('revenue')) {
      newAlerts.push({
        id: 'revenue',
        type: 'warning',
        message: 'Revenue has decreased by 20% this week. Consider promotional campaigns.',
        actionLabel: 'View Insights',
        action: () => window.location.href = '/seller/analytics'
      })
    }
    
    setAlerts(newAlerts.filter(a => !dismissedAlerts.has(a.id)))
  }, [stats, dismissedAlerts])

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]))
  }

  // Calculate wallet balance from stats (must be before early returns)
  useEffect(() => {
    if (stats) {
      setWalletBalance(stats.walletBalance)
    }
  }, [stats])

  if (sellerLoading) return <PageLoader />

  if (!seller) {
    return (
      <div className="p-6 max-w-lg mx-auto dark:bg-ink-950 min-h-screen">
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-6 border-l-4 border-amber-400">
          <h2 className="font-bold text-lg text-ink-900 dark:text-white mb-2">Store Not Created Yet</h2>
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
            Complete your store setup to access the seller dashboard.
          </p>
          <Link href="/seller/settings?onboarding=true" className="btn-primary inline-flex">Create Store →</Link>
        </div>
      </div>
    )
  }

  if (seller?.status === 'pending') {
    return (
      <div className="p-6 max-w-lg mx-auto dark:bg-ink-950 min-h-screen">
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-6 border-l-4 border-amber-400">
          <h2 className="font-bold text-lg text-ink-900 dark:text-white mb-2">Store Verification Pending</h2>
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
            Your store is under review. You&apos;ll receive an email notification once approved (usually 24-48 hours).
          </p>
          <Link href="/seller/settings" className="btn-outline text-sm">Complete Store Setup →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto dark:bg-ink-950 min-h-screen">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">Welcome back, {seller?.store_name || 'Seller'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/seller/products/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          <Link href="/seller/notifications" className="relative p-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/seller/settings" className="p-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <DismissibleAlert
          type="error"
          onDismiss={() => refetch()}
        >
          Failed to load dashboard data. Please try again.
        </DismissibleAlert>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3 mb-6">
          {alerts.map(alert => (
            <DismissibleAlert
              key={alert.id}
              type={alert.type}
              onDismiss={() => handleDismissAlert(alert.id)}
              actionLabel={alert.actionLabel}
              action={alert.action}
            >
              {alert.message}
            </DismissibleAlert>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <StatCard 
            label="Revenue" 
            value={formatTZS(stats.totalRevenue)} 
            icon={<DollarSign className="w-5 h-5" />} 
            accent="brand" 
            subtitle={<><ArrowUpRight className="w-3 h-3 inline mr-1" />{formatTZS(stats.recentRevenue)} this week</>} 
          />
          <StatCard 
            label="Orders" 
            value={stats.totalOrders} 
            icon={<ShoppingBag className="w-5 h-5" />} 
            accent="spice" 
            subtitle={`${stats.completedOrders} completed`} 
          />
          <StatCard 
            label="Pending" 
            value={stats.pendingOrders} 
            icon={<Clock className="w-5 h-5" />} 
            accent="gold" 
            subtitle={stats.pendingOrders > 0 ? 'Needs attention' : 'All caught up'} 
          />
          <StatCard 
            label="Products" 
            value={stats.totalProducts} 
            icon={<Package className="w-5 h-5" />} 
            accent="green"
            subtitle={`${stats.lowStockProducts} low stock`} 
          />
          <StatCard 
            label="Customers" 
            value={stats.totalCustomers} 
            icon={<Users className="w-5 h-5" />} 
            accent="brand"
            subtitle={`${(stats.conversionRate * 100).toFixed(1)}% conversion`} 
          />
          <StatCard 
            label="Wallet" 
            value={formatTZS(stats.walletBalance)} 
            icon={<Wallet className="w-5 h-5" />} 
            accent="spice"
            subtitle={stats.pendingWithdrawals > 0 ? `${formatTZS(stats.pendingWithdrawals)} pending` : 'Available for withdrawal'} 
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="xl:col-span-1 space-y-4">
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/seller/products/new" className="group p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 hover:bg-brand-100 dark:hover:bg-brand-950 transition-colors">
                <Plus className="w-6 h-6 text-brand-600 dark:text-brand-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Add Product</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">Launch new item</p>
              </Link>
              <Link href="/seller/orders" className="group p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors">
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Process Orders</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{stats?.pendingOrders || 0} pending</p>
              </Link>
              <Link href="/seller/analytics" className="group p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors">
                <BarChart2 className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Analytics</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">View insights</p>
              </Link>
              <Link href="/seller/messages" className="group p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Messages</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{unreadCount} unread</p>
              </Link>
            </div>
          </div>

          {/* Wallet Summary */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Wallet Summary</h2>
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Available</p>
                      <p className="font-semibold text-ink-900 dark:text-white">{formatTZS(stats.walletBalance)}</p>
                    </div>
                  </div>
                  <button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Withdraw
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Pending Payouts</p>
                      <p className="font-semibold text-ink-900 dark:text-white">${stats.unpaidCommissions.toFixed(2)}</p>
                    </div>
                  </div>
                  <button className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Performance Summary */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Performance</h2>
            {stats && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-ink-500 dark:text-ink-400">Conversion Rate</p>
                    <p className="text-xs font-medium text-ink-900 dark:text-white">{(stats.conversionRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${stats.conversionRate * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-ink-500 dark:text-ink-400">Avg. Order Value</p>
                    <p className="text-xs font-medium text-ink-900 dark:text-white">{formatTZS(stats.averageOrderValue)}</p>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(stats.averageOrderValue / 10, 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-ink-500 dark:text-ink-400">Inventory Efficiency</p>
                    <p className="text-xs font-medium text-ink-900 dark:text-white">{stats.totalProducts > 0 ? ((stats.totalProducts - stats.lowStockProducts) / stats.totalProducts * 100).toFixed(0) : '100'}%</p>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: stats.totalProducts ? ((stats.totalProducts - stats.lowStockProducts) / stats.totalProducts * 100) : 0 }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800 dark:text-ink-100">Recent Orders</h2>
              <Link href="/seller/orders" className="text-xs text-brand-600 dark:text-brand-300 font-medium hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {ordersLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-sm text-ink-500 dark:text-ink-400 text-center py-4">No orders yet</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-ink-100 dark:border-ink-800 bg-white/5 dark:bg-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{order.buyer?.full_name || 'Customer'} • {formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                        order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                        order.status === 'packed' ? 'bg-purple-100 text-purple-600' :
                        order.status === 'out_for_delivery' ? 'bg-indigo-100 text-indigo-600' :
                        'bg-red-100 text-red-600'
                      }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-ink-900 dark:text-white">{formatTZS(order.total_amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Products */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800 dark:text-ink-100">Your Products</h2>
              <Link href="/seller/products" className="text-xs text-brand-600 dark:text-brand-300 font-medium hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {stats?.totalProducts === 0 ? (
                <p className="text-sm text-ink-500 dark:text-ink-400 text-center py-4">No products yet. <Link href="/seller/products/new" className="text-brand-600 hover:underline font-medium">Add your first product</Link></p>
              ) : (
                <p className="text-sm text-ink-500 dark:text-ink-400 text-center py-4">Manage your products in <Link href="/seller/products" className="text-brand-600 hover:underline font-medium">Products</Link></p>
              )}
            </div>
          </div>

          {/* Customer Insights */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Customer Insights</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500 dark:text-ink-400">Total Customers</span>
                <span className="text-sm font-semibold text-ink-900 dark:text-white">{stats?.totalCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500 dark:text-ink-400">Total Orders</span>
                <span className="text-sm font-semibold text-ink-900 dark:text-white">{stats?.totalOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500 dark:text-ink-400">Completed Orders</span>
                <span className="text-sm font-semibold text-ink-900 dark:text-white">{stats?.completedOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-500 dark:text-ink-400">Pending Orders</span>
                <span className="text-sm font-semibold text-ink-900 dark:text-white">{stats?.pendingOrders || 0}</span>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

