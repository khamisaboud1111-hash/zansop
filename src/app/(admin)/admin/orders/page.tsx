'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import type { Order, OrderStatus } from '@/types'
import toast from 'react-hot-toast'

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('orders')
      .select(`*, buyer:profiles(full_name, phone), items:order_items(id)`)
      .order('created_at', { ascending: false })
      .limit(100)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) {
      console.error('Failed to load orders:', error.message)
      toast.error('Imeshindikana kupakia maagizo')
    }
    setOrders(data ?? [])
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => { load() }, [load])

  if (loading) return <PageLoader />

  const statuses: Array<'all' | OrderStatus> = ['all', 'pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled']

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-5">Maagizo Yote</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {statuses.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors flex-shrink-0 ${filter === f ? 'bg-brand-500 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-300'}`}>
            {f === 'all' ? 'Zote' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="w-10 h-10" />} title="Hakuna maagizo" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase">Agizo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase hidden sm:table-cell">Mteja</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase">Jumla</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-ink-600 uppercase">Hali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-ink-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-ink-400">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-ink-700">{order.buyer?.full_name}</p>
                      <p className="text-xs text-ink-400">{order.buyer?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink-900">{formatTZS(order.total_amount)}</td>
                    <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

