'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Types
export interface SellerDashboardStats {
  totalRevenue: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalProducts: number
  lowStockProducts: number
  unpaidCommissions: number
  totalCustomers: number
  averageOrderValue: number
  conversionRate: number
  recentRevenue: number
  inventoryValue: number
  walletBalance: number
  pendingWithdrawals: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  sku: string
  weight_grams: number | null
  status: 'draft' | 'active' | 'out_of_stock' | 'rejected'
  is_made_in_zanzibar: boolean
  category_id: string
  category?: { id: string; name_sw: string; name_en: string }
  images: { id: string; url: string; is_primary: boolean; sort_order: number }[]
  videos: { id: string; url: string; sort_order: number }[]
  total_sold: number
  average_rating: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  status: string
  total_amount: number
  delivery_fee: number
  created_at: string
  buyer_id: string
  buyer?: { full_name: string; email: string; phone: string }
  delivery_address: string
  delivery_phone: string
  items: any[]
  delivery_zone: string
}

interface ProductsResponse {
  products: Product[]
  stats: {
    total: number
    active: number
    draft: number
    lowStock: number
    totalValue: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// API fetch functions
async function fetchDashboardStats(): Promise<SellerDashboardStats> {
  const response = await fetch('/api/seller/dashboard', { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to fetch dashboard stats')
  const data = await response.json()
  return data.stats
}

async function fetchProducts(params: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string } = {}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.status && params.status !== 'all') searchParams.set('status', params.status)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const response = await fetch(`/api/seller/products?${searchParams.toString()}`, { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to fetch products')
  return response.json()
}

async function fetchOrders(params: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.search) searchParams.set('search', params.search)
  if (params.status && params.status !== 'all') searchParams.set('status', params.status)

  const response = await fetch(`/api/seller/orders?${searchParams.toString()}`, { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to fetch orders')
  return response.json()
}

// React Query hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['seller', 'dashboard', 'stats'],
    queryFn: async () => {
      try {
        return await fetchDashboardStats()
      } catch {
        // Never surface a full-page error for dashboard stats — return empty
        // defaults so the seller always sees content, never an error page.
        return {
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
        } as SellerDashboardStats
      }
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useProducts(params: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string } = {}) {
  return useQuery({
    queryKey: ['seller', 'products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export function useOrders(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ['seller', 'orders', params],
    queryFn: () => fetchOrders(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

// Mutation hooks
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await fetch(`/api/seller/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/seller/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to delete product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ orderId, status, note }: { orderId: string; status: string; note?: string }) => {
      const response = await fetch('/api/seller/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, status, note }),
      })
      if (!response.ok) throw new Error('Failed to update order')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] })
    },
  })
}

export function useBulkUpdateOrders() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ orderIds, status, note }: { orderIds: string[]; status: string; note?: string }) => {
      const responses = await Promise.all(
        orderIds.map(orderId => 
          fetch('/api/seller/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ orderId, status, note }),
          })
        )
      )
      
      for (const response of responses) {
        if (!response.ok) throw new Error('Failed to update some orders')
      }
      
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] })
    },
  })
}

// Hook for prefetching data
export function usePrefetchSellerData() {
  const queryClient = useQueryClient()
  
  return useCallback(async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['seller', 'dashboard', 'stats'],
        queryFn: fetchDashboardStats,
      }),
      queryClient.prefetchQuery({
        queryKey: ['seller', 'products', { page: 1, limit: 20 }],
        queryFn: () => fetchProducts({ page: 1, limit: 20 }),
      }),
      queryClient.prefetchQuery({
        queryKey: ['seller', 'orders', { page: 1, limit: 20 }],
        queryFn: () => fetchOrders({ page: 1, limit: 20 }),
      }),
    ])
  }, [queryClient])
}

import { useCallback } from 'react'

