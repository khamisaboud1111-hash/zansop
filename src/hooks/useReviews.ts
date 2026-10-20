'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Review } from '@/types'

export function useProductReviews(productId: string) {
  const supabase = useMemo(() => createClient(), [])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*, buyer:profiles(full_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    setReviews(data ?? [])
    setLoading(false)
  }, [productId, supabase])

  useEffect(() => { fetch() }, [fetch])
  return { reviews, loading, refetch: fetch }
}

export function useReviewableOrders() {
  const supabase = useMemo(() => createClient(), [])
  const [reviewable, setReviewable] = useState<Array<{ order_id: string; product_id: string; product_name: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, items:order_items(product_id, product:products(name))')
        .eq('buyer_id', user.id)
        .eq('status', 'delivered')

      const candidates = (orders ?? []).flatMap((o: any) =>
        o.items.map((i: any) => ({ order_id: o.id, product_id: i.product_id, product_name: i.product?.name ?? '' }))
      )

      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('order_id, product_id')
        .eq('buyer_id', user.id)

      const reviewedKeys = new Set((existingReviews ?? []).map((r: any) => `${r.order_id}-${r.product_id}`))
      setReviewable(candidates.filter((c: any) => !reviewedKeys.has(`${c.order_id}-${c.product_id}`)))
      setLoading(false)
    }
    load()
  }, [supabase])

  return { reviewable, loading }
}

export async function submitReview(opts: { productId: string; orderId: string; rating: number; comment?: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: opts.productId,
      order_id: opts.orderId,
      buyer_id: user.id,
      rating: opts.rating,
      comment: opts.comment ?? null,
    })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}       

