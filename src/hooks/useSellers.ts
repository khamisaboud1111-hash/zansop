'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Seller } from '@/types'

export interface SellerFilters {
  category?: string
  search?: string
  sort?: 'rating' | 'sales' | 'newest'
  page?: number
  pageSize?: number
}

export function useSellers(filters: SellerFilters = {}) {
  const supabase = useMemo(() => createClient(), [])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { category, search, sort = 'rating', page = 1, pageSize = 12 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    let categoryId: string | null = null
    if (category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .maybeSingle()
      categoryId = cat?.id ?? null
    }

    if (category && !categoryId) {
      setSellers([])
      setCount(0)
      setLoading(false)
      return
    }

    let q = supabase
      .from('sellers')
      .select(`
        *,
        images:seller_logos(*),
        banners:seller_banners(*)
      `, { count: 'exact' })
      .eq('status', 'active')
      .range(from, to)

    if (categoryId) q = q.eq('category_id', categoryId)
    if (search) q = q.ilike('store_name', `%${search}%`)

    switch (sort) {
      case 'sales':
        q = q.order('total_sales', { ascending: false })
        break
      case 'newest':
        q = q.order('created_at', { ascending: false })
        break
      default:
        q = q.order('rating', { ascending: false })
    }

    const { data, error: err, count: c } = await q
    if (err) setError(err.message)
    else { setSellers(data ?? []); setCount(c ?? 0) }
    setLoading(false)
  }, [category, search, sort, page, pageSize, supabase])

  useEffect(() => { fetch() }, [fetch])

  return { sellers, count, loading, error, refetch: fetch, totalPages: Math.ceil(count / pageSize) }
}

