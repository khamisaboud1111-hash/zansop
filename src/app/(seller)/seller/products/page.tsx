'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertTriangle, Search, Filter, Download, Grid3X3, List, CheckSquare, Square, ChevronDown, Package, ArrowUpDown, Share2, MessageCircle, Save, Clock, Settings } from 'lucide-react'
import { useSeller } from '@/hooks/useSeller'
import { ProductStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog, PageLoader, EmptyState, StatCard } from '@/components/ui'
import { formatTZS } from '@/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/lib/query/hooks'
import { DismissibleAlert } from '@/components/shared/DismissibleAlert'
import { VirtualList } from '@/components/shared/VirtualList'
import { cn } from '@/utils'

type FilterStatus = 'all' | 'active' | 'draft' | 'out_of_stock'

export default function SellerProductsPage() {
  const { seller, loading: sellerLoading } = useSeller()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const { data, isLoading, error, refetch } = useProducts({
    search,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
  })

  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()

  const products = data?.products ?? []
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 }

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
    totalValue: products.reduce((s, p) => s + p.price * p.stock_quantity, 0),
  }

  const viewProducts = filtered.slice(0, viewMode === 'grid' ? 24 : 50)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }

  async function toggleStatus(product: Product) {
    const newStatus = product.status === 'active' ? 'draft' : 'active'
    try {
      await updateProductMutation.mutateAsync({ id: product.id, data: { status: newStatus } })
      toast.success(newStatus === 'active' ? 'Product published' : 'Product hidden')
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteProductMutation.mutateAsync(deleteId)
      toast.success('Product deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteId(null)
      setDeleting(false)
    }
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return
    setBulkLoading(true)
    const ids = Array.from(selected)

    try {
      if (bulkAction === 'delete') {
        await Promise.all(ids.map(id => deleteProductMutation.mutateAsync(id)))
        toast.success(`${ids.length} products deleted`)
      } else {
        const newStatus = bulkAction === 'activate' ? 'active' : 'draft'
        await Promise.all(ids.map(id => updateProductMutation.mutateAsync({ id, data: { status: newStatus } })))
        toast.success(`${ids.length} products updated`)
      }
      setSelected(new Set())
      setBulkAction(null)
    } catch {
      toast.error('Failed to perform bulk action')
    } finally {
      setBulkLoading(false)
    }
  }

  if (sellerLoading) return <PageLoader />

  // Seller profile header - Instagram style
  return (
    <div className="min-h-screen bg-background">
      {/* Seller Profile Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="page-container py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-ink-100 flex-shrink-0">
                  {seller?.logo_url ? (
                    <Image src={seller.logo_url} alt={seller.store_name} width={56} height={56} unoptimized className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600">
                      <span className="text-2xl font-bold text-white">{seller?.store_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white ring-2 ring-white flex items-center justify-center">
                    {seller?.status === 'approved' ? (
                      <span className="text-[10px] font-bold text-emerald-600">✓</span>
                    ) : seller?.status === 'pending' ? (
                      <span className="text-[10px] font-bold text-amber-600">⏳</span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-600">✕</span>
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="font-display font-black text-xl text-ink-900 dark:text-white">{seller?.store_name ?? 'My Store'}</h1>
                  <p className={cn('text-sm', seller?.status === 'approved' ? 'text-emerald-600' : seller?.status === 'pending' ? 'text-amber-600' : 'text-red-600')}>
                    {seller?.status === 'approved' ? '✓ Verified Seller' : seller?.status === 'pending' ? '⏳ Verification Pending' : '✕ Suspended'}
                  </p>
                </div>
              </div>
              {seller?.description && (
                <p className="text-sm text-ink-600 dark:text-ink-400 max-w-md">{seller.description}</p>
              )}
            </div>

            <div className="flex items-end gap-2 sm:flex-1">
              <Link href="/seller/products/new" className="btn-primary flex-1 sm:auto gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Product
              </Link>
              <Link href="/seller/settings" className="btn-secondary flex-1 sm:auto text-sm gap-1.5">
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <DismissibleAlert type="error" onDismiss={() => refetch()} className="mb-4 page-container">
          Failed to load products. Please try again.
        </DismissibleAlert>
      )}

      {/* Stats Row */}
      <div className="page-container grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Products" value={stats.total} icon={<Package className="w-5 h-5" />} accent="brand" />
        <StatCard label="Active" value={stats.active} icon={<Eye className="w-5 h-5" />} accent="green" />
        <StatCard label="Draft" value={stats.draft} icon={<EyeOff className="w-5 h-5" />} accent="gold" />
        <StatCard label="Low Stock" value={stats.lowStock} icon={<AlertTriangle className="w-5 h-5" />} accent="spice" />
      </div>

      {/* Search & Filters */}
      <div className="page-container flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input pl-9 text-sm w-full"
          />
        </div>
        <div className="flex gap-2 sm:flex-1">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'all' ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600'}`}>All</button>
          <button onClick={() => setStatusFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'active' ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-600'}`}>Active</button>
          <button onClick={() => setStatusFilter('draft')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'draft' ? 'bg-amber-500 text-white' : 'bg-ink-100 text-ink-600'}`}>Draft</button>
          <button onClick={() => setStatusFilter('out_of_stock')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'out_of_stock' ? 'bg-red-500 text-white' : 'bg-ink-100 text-ink-600'}`}>Out of Stock</button>
        </div>
        <div className="flex gap-2 sm:flex-1 justify-end">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-400 hover:bg-ink-50'}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-400 hover:bg-ink-50'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="page-container mb-4 p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium text-brand-800">{selected.size} products selected</span>
          <div className="flex gap-2">
            <button onClick={() => setBulkAction('activate')} disabled={bulkLoading} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-colors">
              Publish
            </button>
            <button onClick={() => setBulkAction('deactivate')} disabled={bulkLoading} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 transition-colors">
              Hide
            </button>
            <button onClick={() => setBulkAction('delete')} disabled={bulkLoading} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors">
              Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="page-container grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-[360px] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="page-container text-center py-20">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-ink-400" />
          </div>
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
            {search || statusFilter !== 'all' ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-ink-500 dark:text-ink-400 max-w-xs mx-auto mb-6">
            {search || statusFilter !== 'all' ? 'Try different filters or add a new product' : 'Start by adding your first product'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link href="/seller/products/new" className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="page-container grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {viewProducts.map((p) => {
            const img = p.images?.find(i => i.is_primary) ?? p.images?.[0]
            const isSelected = selected.has(p.id)
            return (
              <div key={p.id} className={`card rounded-2xl overflow-hidden group transition-all hover:shadow-xl ${isSelected ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-950/20' : ''}`}>
                <div className="relative aspect-square bg-ink-100">
                  <button
                    onClick={() => toggleSelect(p.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-all"
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4 text-brand-600" /> : <Square className="w-4 h-4 text-ink-300" />}
                  </button>
                  <Link href={`/products/${p.slug}`} className="block">
                    {img ? (
                      <Image
                        src={img.url}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-ink-300" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <ProductStatusBadge status={p.status} />
                    </div>
                    {p.stock_quantity > 0 && p.stock_quantity <= 5 && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {p.stock_quantity}
                      </div>
                    )}
                  </Link>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3">
                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(p) }}
                        className="p-2 rounded-lg bg-white text-brand-600 hover:bg-brand-50 transition-colors" title={p.status === 'active' ? 'Hide' : 'Publish'}
                      >
                        {p.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(p.id) }}
                        className="p-2 rounded-lg bg-white text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <Link href={`/products/${p.slug}`} className="block">
                    <p className="font-semibold text-sm text-ink-900 dark:text-white truncate mb-1">{p.name}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">{p.stock_quantity} in stock</p>
                    <span className="font-display font-bold text-brand-700">{formatTZS(p.price)}</span>
                  </Link>
                  <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-ink-100">
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(p) }} className="p-1.5 rounded-lg text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors" title={p.status === 'active' ? 'Hide' : 'Publish'}>
                      {p.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <Link href={`/seller/products/edit/${p.id}`} className="p-1.5 rounded-lg text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="page-container card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-ink-400 hover:text-ink-600">
                      {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide hidden sm:table-cell">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Stock</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {viewProducts.map(p => {
                  const img = p.images?.find(i => i.is_primary) ?? p.images?.[0]
                  const isSelected = selected.has(p.id)
                  return (
                    <tr key={p.id} className={`hover:bg-ink-50 transition-colors ${isSelected ? 'bg-brand-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(p.id)} className="text-ink-400 hover:text-ink-600">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-brand-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                            {img ? <Image src={img.url} alt="" fill sizes="40px" className="object-cover" /> : <div className="w-full h-full bg-ink-100 flex items-center justify-center"><Package className="w-5 h-5 text-ink-300" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${p.slug}`} className="block">
                              <p className="font-medium text-ink-900 dark:text-white truncate max-w-[180px]">{p.name}</p>
                            </Link>
                            {p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                              <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Low stock</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-ink-500">{(p as any).category?.name_sw}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-ink-900">{formatTZS(p.price)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity <= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ProductStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); toggleStatus(p) }} className="p-1.5 rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors" title={p.status === 'active' ? 'Hide' : 'Publish'}>
                            {p.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <Link href={`/seller/products/edit/${p.id}`} className="p-1.5 rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Single Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product" size="sm">
        <ConfirmDialog
          message="Are you sure you want to delete this product? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
          variant="danger"
        />
      </Modal>

      {/* Bulk Action Confirm Modal */}
      <Modal open={!!bulkAction} onClose={() => setBulkAction(null)} title={
        bulkAction === 'delete' ? 'Delete Products' : bulkAction === 'activate' ? 'Publish Products' : 'Hide Products'
      } size="sm">
        <ConfirmDialog
          message={bulkAction === 'delete'
            ? `Are you sure you want to delete ${selected.size} products? This cannot be undone.`
            : `Change to ${bulkAction === 'activate' ? 'published' : 'hidden'} for ${selected.size} products?`}
          onConfirm={handleBulkAction}
          onCancel={() => setBulkAction(null)}
          loading={bulkLoading}
          variant={bulkAction === 'delete' ? 'danger' : 'primary'}
        />
      </Modal>
    </div>
  )
}
