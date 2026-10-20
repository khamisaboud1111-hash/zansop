'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSeller } from '@/hooks/useSeller'
import ProductForm from '@/components/seller/ProductForm'
import { PageLoader } from '@/components/ui'

export default function NewProductPage() {
  const { seller, loading } = useSeller()
  if (loading) return <PageLoader />
  if (!seller) return null

  return (
    <div className="p-4 sm:p-6">
      <Link href="/seller/products" className="flex items-center gap-2 text-sm text-ink-500 hover:text-brand-600 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Bidhaa zangu
      </Link>
      <h1 className="font-display font-black text-2xl text-ink-900 mb-6">Ongeza Bidhaa Mpya</h1>
      <ProductForm seller={seller} />
    </div>
  )
}

