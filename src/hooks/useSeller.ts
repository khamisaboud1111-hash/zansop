'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Seller } from '@/types'

export function useSeller() {
  const supabase = useMemo(() => createClient(), [])
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('sellers')
        .select('*, profile:profiles(*)')
        .eq('user_id', user.id)
        .single()

      setSeller(data)
    } catch (err) {
      console.error('useSeller fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])
  return { seller, loading, refetch: fetch }
}

export function useSellerAnalytics(sellerId: string | null) {
  const supabase = useMemo(() => createClient(), [])
  const [analytics, setAnalytics] = useState<{
    totalRevenue: number
    totalOrders: number
    pendingOrders: number
    totalProducts: number
    lowStockProducts: number
    unpaidCommissions: number
    recentOrders: { status?: string; created_at?: string }[]
    topProducts: { id: string; name: string; stock_quantity: number; total_sold: number; status: string }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sellerId) return

    async function load() {
      setLoading(true)

      const [ordersRes, productsRes, commissionsRes] = await Promise.all([
        supabase
          .from('order_items')
          .select('order_id, total_price, order:orders(status, created_at)')
          .eq('seller_id', sellerId!),

        supabase
          .from('products')
          .select('id, name, stock_quantity, total_sold, status')
          .eq('seller_id', sellerId!),

        supabase
          .from('commissions')
          .select('commission_amount, is_paid')
          .eq('seller_id', sellerId!)
          .eq('is_paid', false),
      ])

      const items = ordersRes.data ?? []
      const products = productsRes.data ?? []
      const commissions = commissionsRes.data ?? []

      const orderMap = new Map<string, { status?: string; created_at?: string }>()
      items.forEach((item: { order_id: string; total_price: number; order: { status: string; created_at: string }[] }) => {
        if (!orderMap.has(item.order_id)) orderMap.set(item.order_id, item.order?.[0])
      })

      const allOrders = Array.from(orderMap.values())
      const totalRevenue = items.reduce((s: number, i: { total_price: number }) => s + i.total_price, 0)
      const pendingOrders = allOrders.filter((o: { status?: string }) => ['pending','confirmed','packed'].includes(o?.status ?? '')).length
      const unpaidCommissions = commissions.reduce((s: number, c: { commission_amount: number }) => s + c.commission_amount, 0)

      const topProducts = [...products]
        .sort((a: { total_sold: number }, b: { total_sold: number }) => b.total_sold - a.total_sold)
        .slice(0, 5)

      setAnalytics({
        totalRevenue,
        totalOrders: orderMap.size,
        pendingOrders,
        totalProducts: products.length,
        lowStockProducts: products.filter((p: { stock_quantity: number }) => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
        unpaidCommissions,
        recentOrders: allOrders.slice(0, 5),
        topProducts,
      })
      setLoading(false)
    }

    load()
  }, [sellerId, supabase])

  return { analytics, loading }
}

