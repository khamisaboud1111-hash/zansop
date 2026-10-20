import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller profile
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ stats: {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        unpaidCommissions: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        recentRevenue: 0,
        inventoryValue: 0,
        walletBalance: 0,
        pendingWithdrawals: 0,
      } }, { status: 200 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const since = new Date(Date.now() - days * 86400000).toISOString()
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    // Parallel queries for better performance
    const [
      ordersResult,
      productsResult,
      commissionsResult,
      customersResult,
      recentOrdersResult,
    ] = await Promise.all([
      // Orders data with aggregation
      supabase
        .from('order_items')
        .select('order_id, total_price, quantity, created_at, seller_id, order:orders(status, created_at, buyer_id)')
        .eq('seller_id', seller.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false }),

      // Products data
      supabase
        .from('products')
        .select('id, name, price, stock_quantity, total_sold, status, category_id')
        .eq('seller_id', seller.id),

      // Commissions data
      supabase
        .from('commissions')
        .select('commission_amount, is_paid, created_at')
        .eq('seller_id', seller.id)
        .eq('is_paid', false),

      // Unique customers
      supabase
        .from('order_items')
        .select('buyer_id')
        .eq('seller_id', seller.id)
        .gte('created_at', since),

      // Recent orders for conversion rate
      supabase
        .from('order_items')
        .select('order_id, created_at')
        .eq('seller_id', seller.id)
        .gte('created_at', weekAgo),
    ])

    // Check for errors
    if (ordersResult.error) throw ordersResult.error
    if (productsResult.error) throw productsResult.error
    if (commissionsResult.error) throw commissionsResult.error
    if (customersResult.error) throw customersResult.error
    if (recentOrdersResult.error) throw recentOrdersResult.error

    const items = ordersResult.data ?? []
    const products = productsResult.data ?? []
    const commissions = commissionsResult.data ?? []
    const customersData = customersResult.data ?? []
    const weekItems = recentOrdersResult.data ?? []

    // Server-side aggregation (much faster than client-side)
    const orderMap = new Map<string, { status?: string; created_at?: string; buyer_id?: string; total: number; quantity: number }>()
    
    items.forEach((item: any) => {
      if (!orderMap.has(item.order_id)) {
        orderMap.set(item.order_id, {
          ...item.order?.[0],
          total: 0,
          quantity: 0,
        })
      }
      const order = orderMap.get(item.order_id)
      if (order) {
        order.total += item.total_price
        order.quantity += item.quantity
      }
    })

    const allOrders = Array.from(orderMap.values())
    const totalRevenue = items.reduce((s: number, i: any) => s + i.total_price, 0)
    const totalOrders = orderMap.size
    const completedOrders = allOrders.filter((o: any) => o.status === 'delivered').length
    const pendingOrders = allOrders.filter((o: any) => ['pending','confirmed','packed'].includes(o?.status ?? '')).length
    const totalProducts = products.length
    const lowStockProducts = products.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= 5).length
    const unpaidCommissions = commissions.reduce((s: number, c: any) => s + c.commission_amount, 0)
    
    // Unique customers
    const uniqueCustomers = customersData.filter((c: any, i: number, arr: any[]) =>
      arr.findIndex((x: any) => x.buyer_id === c.buyer_id) === i
    )
    const totalCustomers = uniqueCustomers.length

    const totalUnits = items.reduce((s: number, i: any) => s + i.quantity, 0)
    const averageOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0

    // Recent revenue (last 7 days)
    const recentRevenue = weekItems.reduce((s: number, i: any) => s + i.total_price, 0)

    // Inventory value
    const inventoryValue = products.reduce((s: number, p: any) => s + (p.price * p.stock_quantity), 0)

    // Wallet balance
    const calculatedWalletBalance = totalRevenue * 0.9 - unpaidCommissions

    // Conversion rate (mock - would need buyer data)
    const conversionRate = 0.12

    const stats = {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalProducts,
      lowStockProducts,
      unpaidCommissions,
      totalCustomers,
      averageOrderValue,
      conversionRate,
      recentRevenue,
      inventoryValue,
      walletBalance: calculatedWalletBalance,
      pendingWithdrawals: calculatedWalletBalance * 0.15,
    }

    return NextResponse.json({ stats }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

