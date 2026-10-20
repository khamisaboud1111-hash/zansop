'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'

/** Call this on a product detail page to record the view (no-op if logged out). */
export function useTrackRecentlyViewed(productId: string | undefined) {
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!productId) return
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      await supabase.rpc('track_recently_viewed', { p_user_id: user.id, p_product_id: productId })
    })()
    return () => { active = false }
  }, [productId, supabase])
}

/** Fetch the current buyer's recently-viewed products (newest first), excluding one product if given. */
export function useRecentlyViewed(excludeProductId?: string, limit = 10) {
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('recently_viewed')
      .select(`viewed_at, product:products(*, images:product_images(*), seller:sellers(store_name, store_slug, average_rating))`)
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(limit + 1) // +1 in case we need to drop the excluded one

    const items = (data ?? [])
      .map((row: any) => row.product as Product)
      .filter((p) => p && p.id !== excludeProductId)
      .slice(0, limit)

    setProducts(items)
    setLoading(false)
  }, [excludeProductId, limit, supabase])

  useEffect(() => { fetch() }, [fetch])

  return { products, loading, refetch: fetch }
}

