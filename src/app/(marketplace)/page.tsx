import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { Product } from '@/types'
import type { HomeStats } from '@/components/home/HeroSection'
import { HomePageClient } from './HomePageClient'

export const dynamic = 'force-dynamic'

async function getStats(): Promise<HomeStats> {
  const empty: HomeStats = { active_sellers: 0, verified_stores: 0, products_available: 0, orders_delivered: 0, active_riders: 0 }
  try {
    const supabase = createServerClient()
    const [sellersRes, verifiedRes, productsRes, ordersRes, ridersRes] = await Promise.all([
      supabase.from('sellers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('sellers').select('id', { count: 'exact', head: true }).eq('status', 'approved').eq('national_id_verified', true),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'rider'),
    ])
    return {
      active_sellers: sellersRes.count ?? 0,
      verified_stores: verifiedRes.count ?? 0,
      products_available: productsRes.count ?? 0,
      orders_delivered: ordersRes.count ?? 0,
      active_riders: ridersRes.count ?? 0,
    }
  } catch {
    return empty
  }
}

async function getFeaturedSellers() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('sellers')
      .select('*')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('total_sales', { ascending: false })
      .limit(6)
    return (data ?? []) as any[]
  } catch {
    return []
  }
}

async function getRecentProducts() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('products')
      .select(`*, seller:sellers(*), images:product_images(*)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8)
    return (data ?? []) as Product[]
  } catch {
    return []
  }
}

async function getCategories() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    return (data ?? []) as any[]
  } catch {
    return []
  }
}

async function getTestimonials() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .limit(6)
    return (data ?? []) as any[]
  } catch {
    return []
  }
}

export default async function MarketplaceHomePage() {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get('lang')?.value

  const [stats, featuredSellers, recentProducts, categories, testimonials] = await Promise.all([
    getStats(),
    getFeaturedSellers(),
    getRecentProducts(),
    getCategories(),
    getTestimonials(),
  ])

  return (
    <HomePageClient
      stats={stats}
      featuredSellers={featuredSellers}
      recentProducts={recentProducts}
      categories={categories}
      testimonials={testimonials}
      lang={(langCookie as any) || 'sw'}
    />
  )
}
