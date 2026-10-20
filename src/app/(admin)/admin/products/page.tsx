'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, X, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductStatusBadge } from '@/components/ui/Badge'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import type { Product, ProductStatus } from '@/types'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ProductStatus>('draft')

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('products')
      .select(`*, seller:sellers(store_name, user_id), category:categories(name_sw), images:product_images(*)`)
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) {
      console.error('Failed to load products:', error.message)
      toast.error('Imeshindikana kupakia bidhaa')
    }
    setProducts(data ?? [])
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => { load() }, [load])

  async function setStatus(product: any, status: ProductStatus) {
    await supabase.from('products').update({ status }).eq('id', product.id)

    if (status === 'active' || status === 'rejected') {
      await supabase.from('notifications').insert({
        user_id: product.seller.user_id,
        type: status === 'active' ? 'product_approved' : 'product_rejected',
        title_en: status === 'active' ? 'Product approved' : 'Product rejected',
        title_sw: status === 'active' ? 'Bidhaa imeidhinishwa' : 'Bidhaa imekataliwa',
        body_en: `Your product "${product.name}" has been ${status === 'active' ? 'approved and is now live' : 'rejected'}.`,
        body_sw: `Bidhaa yako "${product.name}" ${status === 'active' ? 'imeidhinishwa na inaonekana dukani' : 'imekataliwa'}.`,
        link: '/seller/products',
      })
    }

    toast.success('Hali ya bidhaa imebadilishwa')
    load()
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-5">Ukaguzi wa Bidhaa</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {(['draft', 'active', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${filter === f ? 'bg-brand-500 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-300'}`}>
            {f === 'draft' ? 'Rasimu' : f === 'active' ? 'Zinazouzwa' : f === 'rejected' ? 'Zilizokataliwa' : 'Zote'}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState icon={<Package className="w-10 h-10" />} title="Hakuna bidhaa" description={`Hakuna bidhaa za hali "${filter}"`} />
      ) : (
        <div className="space-y-3">
          {products.map((p: any) => {
            const img = p.images?.find((i: any) => i.is_primary) ?? p.images?.[0]
            return (
              <div key={p.id} className="card p-4 flex items-center gap-4 flex-wrap">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                  {img ? <Image src={img.url} alt="" fill sizes="64px" className="object-cover" /> : <Package className="absolute inset-0 m-auto w-6 h-6 text-ink-300" />}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-900">{p.name}</p>
                    <ProductStatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-ink-500">{p.seller?.store_name} · {p.category?.name_sw}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{formatTZS(p.price)} · Hisa: {p.stock_quantity} · {formatDate(p.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.status !== 'active' && (
                    <button onClick={() => setStatus(p, 'active')} className="btn-primary text-xs py-2 px-3 gap-1">
                      <Check className="w-3.5 h-3.5" /> Idhinisha
                    </button>
                  )}
                  {p.status !== 'rejected' && (
                    <button onClick={() => setStatus(p, 'rejected')} className="btn-danger text-xs py-2 px-3 gap-1">
                      <X className="w-3.5 h-3.5" /> Kataa
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

