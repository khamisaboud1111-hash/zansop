'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Loader2, Image as ImageIcon, Play, Camera, Tag, Package, Globe, CheckCircle, Trash2, Edit3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ImageUploader from '@/components/shared/ImageUploader'
import VideoUploader from '@/components/shared/VideoUploader'
import { slugify, generateSKU } from '@/utils'
import type { Product, Category, Seller } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category_id: z.string().min(1, 'Please select a category'),
  price: z.coerce.number().min(100, 'Price must be at least TZS 100'),
  compare_at_price: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().min(0),
  sku: z.string().optional(),
  weight_grams: z.coerce.number().optional(),
  is_made_in_zanzibar: z.boolean(),
  location_area: z.string().optional(),
  pickup_available: z.boolean(),
  delivery_available: z.boolean(),
  status: z.enum(['draft', 'active']),
})
type FormData = z.infer<typeof schema>

interface Props {
  seller: Seller
  product?: Product
}

export default function ProductForm({ seller, product }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<string[]>(product?.images?.map(i => i.url) ?? [])
  const [videos, setVideos] = useState<string[]>(product?.videos?.map(v => v.url) ?? [])
  const [saving, setSaving] = useState(false)
  const isEdit = !!product

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      price: product.price,
      compare_at_price: product.compare_at_price ?? undefined,
      stock_quantity: product.stock_quantity,
      sku: product.sku ?? '',
      weight_grams: product.weight_grams ?? undefined,
      is_made_in_zanzibar: product.is_made_in_zanzibar,
      location_area: product.location_area ?? '',
      pickup_available: product.pickup_available ?? false,
      delivery_available: product.delivery_available ?? true,
      status: product.status as 'draft' | 'active',
    } : {
      is_made_in_zanzibar: false,
      pickup_available: false,
      delivery_available: true,
      status: 'active',
      stock_quantity: 0,
    }
  })

  const name = watch('name')

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data ?? []))
  }, [])

  async function onSubmit(data: FormData) {
    if (images.length === 0) { toast.error('Please add at least one image'); return }
    setSaving(true)

    const slug = slugify(data.name) + '-' + Date.now().toString(36)
    const sku = data.sku || generateSKU(seller.store_name, data.name)

    let productId = product?.id

    if (isEdit) {
      const { error } = await supabase.from('products').update({ ...data, updated_at: new Date().toISOString() }).eq('id', productId!)
      if (error) { toast.error(error.message); setSaving(false); return }
    } else {
      const { data: created, error } = await supabase.from('products').insert({
        ...data, seller_id: seller.id, slug, sku,
      }).select().single()
      if (error || !created) { toast.error(error?.message ?? 'Failed to create product'); setSaving(false); return }
      productId = created.id
    }

    if (productId) {
      if (isEdit) await supabase.from('product_images').delete().eq('product_id', productId)
      const imgRows = images.map((url, i) => ({
        product_id: productId!, url, sort_order: i, is_primary: i === 0,
      }))
      await supabase.from('product_images').insert(imgRows)

      if (isEdit) await supabase.from('product_videos').delete().eq('product_id', productId)
      if (videos.length > 0) {
        const vidRows = videos.map((url, i) => ({ product_id: productId!, url, sort_order: i }))
        await supabase.from('product_videos').insert(vidRows)
      }
    }

    toast.success(isEdit ? 'Product updated' : 'Product created!')
    router.push('/seller/products')
  }

  function fieldError(field: keyof FormData) {
    return errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]!.message}</p> : null
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">{isEdit ? 'Update your product details' : 'Create a new product listing'}</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary gap-2 px-4 py-2.5 text-sm">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </div>

      {errors.root && <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-red-600 text-sm">{errors.root.message}</div>}

      {/* Basic Info */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800 dark:text-ink-100 text-sm font-bold uppercase tracking-wider">Product Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Product Name *</label>
            <input {...register('name')} className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Handmade Zanzibar Spices" />
            {fieldError('name')}
          </div>
          <div>
            <label className="label">Category *</label>
            <select {...register('category_id')} className={`input ${errors.category_id ? 'border-red-400' : ''}`}>
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_sw}</option>)}
            </select>
            {fieldError('category_id')}
          </div>
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea {...register('description')} rows={4} className={`input resize-none ${errors.description ? 'border-red-400' : ''}`} placeholder="Describe your product in detail..." />
          {fieldError('description')}
        </div>

        <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer select-none"
          onClick={() => setValue('is_made_in_zanzibar', !watch('is_made_in_zanzibar'))}>
          <input type="checkbox" {...register('is_made_in_zanzibar')} className="w-4 h-4 rounded accent-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">🏅 Made in Zanzibar</p>
            <p className="text-xs text-amber-600">Tick if this product is made in Zanzibar</p>
          </div>
        </label>
      </section>

      {/* Pricing & Stock */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800 dark:text-ink-100 text-sm font-bold uppercase tracking-wider">Pricing & Stock</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Price (TZS) *</label>
            <input type="number" {...register('price')} className={`input ${errors.price ? 'border-red-400' : ''}`} placeholder="15000" />
            {fieldError('price')}
          </div>
          <div>
            <label className="label">Compare At Price</label>
            <input type="number" {...register('compare_at_price')} className="input" placeholder="20000" />
          </div>
          <div>
            <label className="label">Stock Quantity *</label>
            <input type="number" {...register('stock_quantity')} className="input" placeholder="10" />
            {fieldError('stock_quantity')}
          </div>
          <div>
            <label className="label">SKU</label>
            <input {...register('sku')} className="input" placeholder={name ? generateSKU(seller.store_name, name) : 'Auto'} />
          </div>
          <div>
            <label className="label">Weight (g)</label>
            <input type="number" {...register('weight_grams')} className="input" placeholder="500" />
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800 dark:text-ink-100 text-sm font-bold uppercase tracking-wider">Delivery Options</h2>
        <div className="flex gap-3">
          <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${watch('delivery_available') ? 'border-brand-500 bg-brand-50' : 'border-ink-200'}`}>
            <input type="checkbox" {...register('delivery_available')} className="w-4 h-4 rounded accent-brand-500 shrink-0" />
            <span className="text-sm font-medium">🚚 Delivery Available</span>
          </label>
          <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${watch('pickup_available') ? 'border-brand-500 bg-brand-50' : 'border-ink-200'}`}>
            <input type="checkbox" {...register('pickup_available')} className="w-4 h-4 rounded accent-brand-500 shrink-0" />
            <span className="text-sm font-medium">🏪 Pickup Available</span>
          </label>
        </div>
        <div>
          <label className="label">Location Area</label>
          <input {...register('location_area')} className="input" placeholder="e.g. Stone Town, Michenzani" />
        </div>
      </section>

      {/* Status */}
      <section className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800 dark:text-ink-100 text-sm font-bold uppercase tracking-wider">Status</h2>
        <div className="flex gap-3">
          {['draft', 'active'].map(s => (
            <label key={s} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${watch('status') === s ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-brand-200'}`}>
              <input type="radio" {...register('status')} value={s} className="sr-only" />
              <div>
                <p className={s === 'active' ? 'text-emerald-600 font-semibold' : 'text-ink-700 font-medium'}><span>{s === 'active' ? '✅' : '📝'}</span> {s === 'active' ? 'Active - Published' : 'Draft - Hidden'}</p>
                <p className="text-xs text-ink-500">{s === 'active' ? 'Visible to customers' : 'Hidden from storefront'}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-800 dark:text-ink-100 text-sm font-bold uppercase tracking-wider">Product Images</h2>
          <p className="text-xs text-ink-500">Add at least 1 image (up to 6)</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
              <Image src={url} alt="" width={200} height={200} unoptimized className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-medium">Primary</span>
              )}
              <button type="button" onClick={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <ImageUploader
              bucket="product-images"
              folder={`${seller.id}`}
              aspectRatio="square"
              onChange={(url) => setImages(prev => [...prev, url])}
              label=""
            />
          )}
          {images.length === 0 && <p className="col-span-full text-xs text-red-500 text-center">At least 1 image is required</p>}
        </div>
      </section>

      {/* Videos */}
      <section className="card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 text-sm font-bold uppercase tracking-wider">Product Videos (Optional)</h2>
            <p className="text-xs text-ink-500 mt-0.5">Add up to 2 videos to showcase your product</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {videos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
              <video src={url} className="w-full h-full object-cover" muted />
              <button type="button" onClick={() => setVideos(v => v.filter((_, idx) => idx !== i))}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {videos.length < 2 && (
            <VideoUploader
              folder={`${seller.id}`}
              onChange={(url) => setVideos(prev => [...prev, url])}
            />
          )}
        </div>
      </section>

      {/* Submit */}
      <section className="card p-5">
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 justify-center py-2.5 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5 text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </section>
    </form>
  )
}
