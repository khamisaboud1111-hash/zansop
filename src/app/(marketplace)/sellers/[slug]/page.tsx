import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { BadgeCheck, Star, Package, MessageCircle, MapPin, TrendingUp } from 'lucide-react'
import KikoiStripe from '@/components/shared/KikoiStripe'
import ProductCard from '@/components/product/ProductCard'
import LText from '@/components/shared/LText'
import { SellerReviewList } from '@/components/reviews/ReviewLists'
import { whatsappUrl } from '@/utils'
import type { Metadata } from 'next'

interface Props { params: { id: string } }

async function getSeller(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('sellers')
    .select(`*, profile:profiles(full_name, created_at)`)
    .eq('store_slug', slug)
    .eq('status', 'approved')
    .single()
  return data
}

async function getSellerProducts(sellerId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select(`*, seller:sellers(store_name, status, national_id_verified), category:categories(name_sw), images:product_images(*)`)
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seller = await getSeller(params.id)
  if (!seller) return { title: 'Duka halipatikani' }
  return { title: `${seller.store_name} — Zanshop`, description: seller.description ?? '' }
}

export default async function SellerStorePage({ params }: Props) {
  const seller = await getSeller(params.id)
  if (!seller) notFound()

  const products = await getSellerProducts(seller.id)

  const waMessage = `Habari ${seller.store_name}! Nimeona duka lako kwenye Zanshop. Nina swali...`
  const waUrl = whatsappUrl(seller.whatsapp_number, waMessage)

  return (
    <main className="pb-20 sm:pb-8 dark:bg-ink-950 min-h-screen">
      {/* Banner */}
      <div className="relative h-36 sm:h-48 bg-gradient-to-br from-brand-700 to-brand-500 overflow-hidden">
        {seller.banner_url && (
          <Image src={seller.banner_url} alt="" fill className="object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <KikoiStripe />

      <div className="page-container">
        {/* Store info */}
        <div className="relative -mt-10 mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-ink-900 shadow-card overflow-hidden bg-white dark:bg-ink-800 flex-shrink-0">
              {seller.logo_url ? (
                <Image src={seller.logo_url} alt={seller.store_name} width={80} height={80} unoptimized className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                  <span className="text-brand-700 dark:text-brand-300 font-black text-2xl">{seller.store_name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-xl text-ink-900 dark:text-white">{seller.store_name}</h1>
                {seller.national_id_verified && <BadgeCheck className="w-5 h-5 text-brand-500" />}
              </div>
              {seller.national_id_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-500/20 px-2 py-0.5 rounded-full mt-1">
                  ✓ <LText k="verifiedSellerLabel" />
                </span>
              )}
              <div className="flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {(seller.average_rating ?? 0).toFixed(1)} ({seller.review_count} <LText k="reviews" />)
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <LText k="sales" /> {seller.total_sales}
                </span>
                {seller.location_area && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {seller.location_area}
                  </span>
                )}
              </div>
            </div>
          </div>

          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 active:scale-95 transition-all shadow-sm">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        {/* Description */}
        {seller.description && (
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-6 max-w-2xl">{seller.description}</p>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: <LText k="products" />, value: products.length, icon: Package },
            { label: <LText k="sales" />, value: (seller.total_sales ?? 0).toLocaleString(), icon: TrendingUp },
            { label: <LText k="rating" />, value: `${(seller.average_rating ?? 0).toFixed(1)} ★`, icon: Star },
          ].map((s, i) => (
            <div key={i} className="card dark:bg-ink-900 dark:border-ink-800 p-3 text-center">
              <p className="font-black text-lg text-ink-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Products */}
        <h2 className="font-display font-bold text-lg text-ink-900 dark:text-white mb-4">
          <LText k="productsOf" /> {seller.store_name} ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-12 text-center">
            <Package className="w-8 h-8 text-ink-300 dark:text-ink-600 mx-auto mb-3" />
            <p className="text-ink-500 dark:text-ink-400 text-sm"><LText k="noProductsInStore" /></p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Customer reviews of the shop */}
        <h2 className="font-display font-bold text-lg text-ink-900 dark:text-white mt-10 mb-4">
          <LText k="customerReviews" /> ({seller.review_count})
        </h2>
        <SellerReviewList sellerId={seller.id} />
      </div>
    </main>
  )
}
