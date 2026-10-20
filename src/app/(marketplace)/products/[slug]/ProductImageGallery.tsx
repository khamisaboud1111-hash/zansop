'use client'

import Image from 'next/image'
import { Package } from 'lucide-react'
import { useState } from 'react'
import LText from '@/components/shared/LText'
import type { Product, ProductImage } from '@/types'

interface ProductImageGalleryProps {
  images: ProductImage[]
  product: Product
}

export default function ProductImageGallery({ images, product }: ProductImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(images.findIndex((i) => i.is_primary) >= 0 ? images.findIndex((i) => i.is_primary) : 0)
  const primaryImage = images[selectedIdx] ?? images[0]

  return (
    <div className="space-y-3">
      {/* Main image — zoom on hover */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group cursor-zoom-in">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-125"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {product.is_made_in_zanzibar && (
          <span className="absolute top-3 left-3 badge-orange">
            🏅 <LText k="madeInZanzibar" />
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              onClick={() => setSelectedIdx(idx)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-colors ${selectedIdx === idx ? 'border-brand-500 ring-1 ring-brand-500' : 'border-transparent hover:border-brand-400'}`}
            >
              <Image src={img.url} alt={`${product.name} ${idx + 1}`} fill sizes="80px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
