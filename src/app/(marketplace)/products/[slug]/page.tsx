import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, BadgeCheck } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { ProductReviewList } from '@/components/reviews/ReviewLists'
import LText from '@/components/shared/LText'
import TrackView from './TrackView'
import RecentlyViewedRow from './RecentlyViewedRow'
import AddToCartSection from './AddToCartSection'
import ContactSellerButtons from './ContactSellerButtons'
import ProductImageGallery from './ProductImageGallery'
import { formatTZS, formatDate } from '@/utils'
import type { Metadata } from 'next'

import type { Product, ProductImage, ProductVideo, Review, Seller, Category } from '@/types'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductPageData = any

interface Props {
  params: { slug: string }
}

async function getProduct(slug: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select(`*, seller:sellers(id, store_name, store_slug, status, logo_url, national_id_verified), category:categories(*), images:product_images(*)`, { count: 'exact' })
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  
  if (error) {
    console.error('Product query error:', error)
  }
  
  return data as unknown as ProductPageData | null
}

async function getRelated(categoryId: string, productId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select(`*, seller:sellers(store_name, status, national_id_verified), images:product_images(*)`)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', productId)
    .limit(4)
  return data ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug)
  if (!product) return { title: 'Product not found' }

  const productData = product as ProductPageData

  return {
    title: `${productData.name} - Zanshop`,
    description: productData.description?.slice(0, 160),
  }
}

export default async function ProductPage({ params }: Props) {
  const product = (await getProduct(params.slug)) as ProductPageData | null
  if (!product) notFound()

  const related = product.category_id ? await getRelated(product.category_id, product.id) : []
  const images = product.images ?? []
  const primaryImage = images.find((i: ProductImage) => i.is_primary) ?? images[0]
  const seller = product.seller
  const isVerifiedSeller = seller?.national_id_verified ?? false

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <TrackView productId={product.id} />
      <div className="page-container py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-300"><LText k="home" /></Link>
          <span>/</span>
          <Link href={`/search?category=${product.category?.slug}`} className="hover:text-brand-600 dark:hover:text-brand-300">{product.category?.name_sw}</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <ProductImageGallery images={images} product={product} />

          {/* Product info */}
          <div className="space-y-5">
            <div>
              <Link href={`/sellers/${seller?.store_slug}`} className="text-sm text-brand-600 dark:text-brand-300 font-medium hover:underline flex items-center gap-1">
                {seller?.store_name}
                {isVerifiedSeller && <BadgeCheck className="w-3.5 h-3.5" />}
              </Link>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground mt-1 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= Math.round(product.average_rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground">{(product.average_rating ?? 0).toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({product.review_count} <LText k="reviews" />)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-black text-3xl text-foreground">{formatTZS(product.price)}</span>
              {product.compare_at_price && (
                <>
                  <span className="text-muted-foreground line-through text-lg">{formatTZS(product.compare_at_price)}</span>
                  <span className="badge-orange">
                    -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground">
                {product.stock_quantity > 0 ? (
                  <><LText k="inStock" /> — {product.stock_quantity} <LText k="pieces" /></>
                ) : (
                  <LText k="outOfStock" />
                )}
              </span>
            </div>

            {/* Add to cart */}
            <AddToCartSection product={product} />

            {/* WhatsApp + In-app chat */}
            {seller && (
              <ContactSellerButtons
                seller={seller}
                productName={product.name}
                priceLabel={formatTZS(product.price)}
              />
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2"><LText k="description" /></h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description || <LText k="noDescription" />}
              </p>
            </div>

            {/* Seller card */}
            {seller && (
              <div className="bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wide"><LText k="aboutStore" /></p>
                <Link href={`/sellers/${seller.store_slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {seller.logo_url ? (
                    <Image src={seller.logo_url} alt={seller.store_name} width={48} height={48} unoptimized className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-700 dark:text-brand-300 font-bold text-xl">{seller.store_name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground">{seller.store_name}</p>
                      {isVerifiedSeller && <BadgeCheck className="w-4 h-4 text-brand-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⭐ {(seller.average_rating ?? 0).toFixed(1)} · {seller.review_count} <LText k="reviews" /> · <LText k="sales" /> {seller.total_sales ?? 0}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-10">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            <LText k="customerReviews" /> ({product.review_count})
          </h2>
          <ProductReviewList productId={product.id} />
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display font-bold text-xl text-foreground mb-4"><LText k="relatedProducts" /></h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p: Product) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        <RecentlyViewedRow excludeProductId={product.id} />
      </div>
    </main>
  )
}
