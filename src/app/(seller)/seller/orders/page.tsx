'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Search, Filter, Download, Archive, TrendingUp, Clock, CheckCircle, XCircle, Package, Truck, MapPin, User, Phone, FileText, PackageCheck, PackageX, AlertCircle, ChevronDown, Eye, Edit, Trash2, ArrowUpRight } from 'lucide-react'
import { useSeller } from '@/hooks/useSeller'
import { useOrders, useUpdateOrderStatus, useBulkUpdateOrders } from '@/lib/query/hooks'
import { OrderStatusBadge, Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate, ORDER_STATUS_STEPS } from '@/utils'
import type { Order, OrderStatus } from '@/types'
import toast from 'react-hot-toast'
import ReadyForPickupButton from '@/components/seller/ReadyForPickupButton'
import DeliveryRatingSection from '@/components/delivery/DeliveryRatingSection'
import { DismissibleAlert } from '@/components/shared/DismissibleAlert'
import { VirtualList } from '@/components/shared/VirtualList'

const NEXT_STATUS: Record<string, OrderStatus> = {
  pending: 'confirmed', confirmed: 'packed', packed: 'out_for_delivery', out_for_delivery: 'delivered',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Inasubiri', confirmed: 'Imethibitishwa', packed: 'Imefungashwa',
  out_for_delivery: 'Inasafirishwa', delivered: 'Imefikishwa', cancelled: 'Imefutwa',
}
const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  packed: PackageCheck,
  out_for_delivery: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  packed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  out_for_delivery: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default function SellerOrdersPage() {
  const { seller, loading: sellerLoading } = useSeller()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, refetch, updateOrderStatus, bulkUpdateOrders } = useOrders(seller?.id ?? null)
  
  const orders = data?.orders ?? []
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 }

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.delivery_address ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    setSelectedOrders([])
  }, [statusFilter, searchQuery])

  const handleAdvance = useCallback(async (order: Order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingId(order.id)
    try {
      await updateOrderStatus.mutateAsync({ orderId: order.id, status: next, note })
      setNote('')
      setActiveOrder(null)
      setUpdatingId(null)
      toast.success(`Hali imebadilishwa: ${STATUS_LABELS[next]}`)
    } catch {
      toast.error('Imeshindwa kubadilisha hali')
      setUpdatingId(null)
    }
  }, [note, updateOrderStatus])

  const handleCancel = useCallback(async (order: Order) => {
    setUpdatingId(order.id)
    try {
      await updateOrderStatus.mutateAsync({ orderId: order.id, status: 'cancelled', note: note || 'Imefutwa na muuzaji' })
      setNote('')
      setActiveOrder(null)
      setUpdatingId(null)
      toast.success('Agizo limefutwa')
    } catch {
      toast.error('Imeshindwa kufuta agizo')
      setUpdatingId(null)
    }
  }, [note, updateOrderStatus])

  const handleBulkAction = useCallback(async (action: 'cancel' | 'confirm' | 'pack') => {
    if (selectedOrders.length === 0) return
    
    setUpdatingId('bulk')
    try {
      const nextStatus = action === 'cancel' ? 'cancelled' : action === 'confirm' ? 'confirmed' : 'packed'
      await bulkUpdateOrders.mutateAsync({ orderIds: selectedOrders, status: nextStatus, note: `${action === 'cancel' ? 'Imefutwa' : action === 'confirm' ? 'Imethibitishwa' : 'Imefungashwa'} kwa kikundi` })
      toast.success(`Actions performed on ${selectedOrders.length} orders`)
      setSelectedOrders([])
    } catch {
      toast.error('Kushindwa kufanya hatua kwa kikundi')
    } finally {
      setUpdatingId(null)
    }
  }, [selectedOrders, bulkUpdateOrders])

  function exportOrders() {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Order ID,Customer,Date,Total,Status,Delivery Address\n' +
      filteredOrders.map(order =>
        `${order.id},${order.buyer?.full_name || 'N/A'},${formatDate(order.created_at)},${order.total_amount},${order.status},${order.delivery_address}\n`
      ).join('')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orders-${formatDate(new Date().toISOString())}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Maagizo yametokwa')
  }

  function handleSelectAll() {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id))
    }
  }

  function handleSelectOrder(orderId: string) {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
    } else {
      setSelectedOrders([...selectedOrders, orderId])
    }
  }

  if (sellerLoading) return <PageLoader />

  let content;
  if (isLoading) {
    content = (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-ink-200 rounded w-32"></div>
              <div className="h-6 bg-ink-200 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-ink-200 rounded"></div>
              <div className="h-3 bg-ink-200 rounded"></div>
              <div className="h-3 bg-ink-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (filteredOrders.length === 0) {
    content = (
      <EmptyState
        icon={<Search className="w-12 h-12" />}
        title="Hakuna maagizo iliyofindwa"
        description={searchQuery || statusFilter !== 'all' ? "Jaribu miongozo tofauti ya utafutaji" : "Maagizo kutoka kwa wateja yatakuja hapa"}
      />
    );
  } else {
    content = (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-ink-50 dark:bg-ink-900 rounded-xl text-sm font-medium text-ink-600">
          <input
            type="checkbox"
            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <div className="flex-1">Agizo</div>
          <div className="hidden sm:block">Mteja</div>
          <div className="hidden md:block">Tarehe</div>
          <div className="hidden lg:block">Jumla</div>
          <div className="hidden sm:block">Hali</div>
          <div className="text-center">Vitendo</div>
        </div>

        {/* Order Cards - VirtualList */}
        <VirtualList
          items={filteredOrders}
          itemHeight={280}
          renderItem={(order) => {
            const sellerItems = order.items?.filter((i: any) => i.seller_id === seller?.id) ?? order.items ?? []
            const next = NEXT_STATUS[order.status]
            const StatusIcon = STATUS_ICONS[order.status]
            const isSelected = selectedOrders.includes(order.id)

            return (
              <div
                key={order.id}
                className={`card p-4 transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-950/20' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOrder(order.id)}
                    className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-ink-900 truncate">#{order.id.slice(-8).toUpperCase()}</p>
                      {order.status === 'pending' && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-ink-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="hidden sm:inline">{order.buyer?.full_name || 'Mteja hajulikani'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="hidden md:inline truncate max-w-[150px]">{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <p className="font-semibold text-ink-900">{formatTZS(order.total_amount)}</p>
                    <p className="text-xs text-ink-500">{sellerItems.length} bidhaa</p>
                  </div>

                  <div className="hidden sm:block">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="hidden lg:inline">{STATUS_LABELS[order.status]}</span>
                    </div>
                  </div>

                  <div className="text-center">
                    {order.status === 'packed' ? (
                      <ReadyForPickupButton
                        orderId={order.id}
                        sellerId={seller!.id}
                        sellerLatitude={(seller as any).latitude}
                        sellerLongitude={(seller as any).longitude}
                        sellerAddress={seller!.store_name}
                        deliveryAddress={order.delivery_address}
                        suggestedFee={order.delivery_fee}
                      />
                    ) : next ? (
                      <button
                        onClick={() => setActiveOrder(activeOrder?.id === order.id ? null : order)}
                        className="p-2 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-50 transition-colors"
                        title="Maoni"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Expanded Actions Panel */}
                {activeOrder?.id === order.id && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="mt-4 pt-4 border-t border-ink-100 space-y-4">
                    <div className="bg-ink-50 dark:bg-ink-900 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-ink-900 mb-2">Maelezo (hiari)</h4>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Maelezo (hiari)..."
                        rows={2}
                        className="input text-xs resize-none w-full"
                      />

                      <div className="flex flex-wrap gap-2 mt-3">
                        {next && order.status === 'packed' ? (
                          <button
                            onClick={() => handleAdvance(order)}
                            disabled={!!updatingId}
                            className="btn-primary text-xs py-2 px-3 flex items-center gap-2"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {updatingId === order.id ? 'Inabadilisha...' : `→ ${STATUS_LABELS[next]}`}
                          </button>
                        ) : next ? (
                          <button
                            onClick={() => handleAdvance(order)}
                            disabled={!!updatingId}
                            className="btn-primary text-xs py-2 px-3 flex items-center gap-2"
                          >
                            {updatingId === order.id ? 'Inabadilisha...' : `→ ${STATUS_LABELS[next]}`}
                          </button>
                        ) : null}

                        {(order as any).status !== 'out_for_delivery' && (order as any).status !== 'delivered' && (
                          <button
                            onClick={() => handleCancel(order)}
                            disabled={!!updatingId}
                            className="btn-danger text-xs py-2 px-3 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            {updatingId === order.id ? 'Inafuta...' : 'Futa'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }}
          itemKey={(order) => order.id}
          overscan={3}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900">Maagizo</h1>
          <p className="text-sm text-ink-500 mt-1">{filteredOrders.length} maagizo ({orders.length} total)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleBulkAction('confirm')}
            disabled={selectedOrders.length === 0 || updatingId === 'bulk'}
            className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" /> Thibitisha ({selectedOrders.length})
          </button>
          <button
            onClick={() => handleBulkAction('pack')}
            disabled={selectedOrders.length === 0 || updatingId === 'bulk'}
            className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PackageCheck className="w-4 h-4" /> Funga ({selectedOrders.length})
          </button>
          <button
            onClick={() => handleBulkAction('cancel')}
            disabled={selectedOrders.length === 0 || updatingId === 'bulk'}
            className="btn-danger gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" /> Futa ({selectedOrders.length})
          </button>
          <button
            onClick={exportOrders}
            className="btn-secondary gap-2"
          >
            <Download className="w-4 h-4" /> Hamisha
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <DismissibleAlert type="error" onDismiss={() => { setError(null); refetch() }} className="mb-4">
          Imeshindwa kupakia maagizo. Jaribu tena.
        </DismissibleAlert>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="Tafuta kwa namba ya agizo, jina la mteja, anwani..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-10 appearance-none w-full cursor-pointer"
            >
              <option value="all">Mao Yote</option>
              <option value="pending">Inasubiri</option>
              <option value="confirmed">Imethibitishwa</option>
              <option value="packed">Imefungashwa</option>
              <option value="out_for_delivery">Inasafirishwa</option>
              <option value="delivered">Imefikishwa</option>
              <option value="cancelled">Imefutwa</option>
            </select>
          </div>
        </div>
      </div>

      {content}
    </div>
  )
}

