'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Product } from '@/types'

export interface MarketplaceProductFilters {
  category?: string
  search?: string
  madeInZanzibar?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  pageSize?: number
}

interface MarketplaceProductsResponse {
  data: (Product & { seller: any; category: any; images: any[] })[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export function useMarketplaceProducts(filters: MarketplaceProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { category, search, madeInZanzibar, sort = 'newest', page = 1, pageSize = 20 } = filters

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    if (madeInZanzibar) params.set('made_in_zanzibar', 'true')
    if (sort !== 'newest') params.set('sort', sort)
    params.set('page', page.toString())
    params.set('pageSize', pageSize.toString())

    try {
      // Simple fetch with timeout using Promise.race
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(`/api/products?${params.toString()}`, {
        signal: controller.signal,
        credentials: 'include',
        cache: 'no-store',
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Products API error:', response.status, errorText)
        throw new Error(`Failed to fetch products: ${response.status}`)
      }

      const result: MarketplaceProductsResponse = await response.json()
      setProducts(result.data ?? [])
      setCount(result.count ?? 0)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - please check your connection')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
        console.error('Products fetch error:', errorMessage)
        setError(errorMessage)
      }
      setProducts([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [category, search, madeInZanzibar, sort, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  return { products, count, loading, error, refetch: fetch, totalPages: Math.ceil(count / pageSize) }
}

