'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus } from '@/types'

export function useBuyerOrders() {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('orders')
      .select(`*, items:order_items(*, product:products(name, images:product_images(*)))`)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    setOrders(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])
  return { orders, loading, refetch: fetch }
}

export function useSellerOrders(sellerId: string | null) {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!sellerId) return
    setLoading(true)

    const { data: items } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('seller_id', sellerId)

    const orderIds = [...new Set((items ?? []).map((i: any) => i.order_id))]
    if (orderIds.length === 0) { setOrders([]); setLoading(false); return }

    const { data } = await supabase
      .from('orders')
      .select(`*, items:order_items(*, product:products(name, images:product_images(*)))`)
      .in('id', orderIds)
      .order('created_at', { ascending: false })

    setOrders(data ?? [])
    setLoading(false)
  }, [sellerId, supabase])

  useEffect(() => { fetch() }, [fetch])

  async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
    const supabase2 = createClient()
    const { data: { user } } = await supabase2.auth.getUser()
    if (!user) return

    await supabase2.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    await supabase2.from('order_tracking').insert({ order_id: orderId, status, note: note || null, created_by: user.id })
    fetch()
  }

  return { orders, loading, refetch: fetch, updateOrderStatus }
}

