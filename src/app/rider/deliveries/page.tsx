'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Download, Star, MapPin, Navigation, Clock, Package } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'

interface DeliveryRecord {
  id: string
  order_id: string
  status: string
  pickup_address: string
  delivery_address: string
  delivery_fee: number
  distance_meters: number | null
  accepted_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  created_at: string
  buyer?: { full_name: string } | null
  seller?: { store_name: string } | null
  rider_rating?: number | null
}

type FilterStatus = 'all' | 'delivered' | 'cancelled'

export default function RiderDeliveriesPage() {
  const supabase = useMemo(() => createClient(), [])
  const { profile, loading: userLoading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('deliveries')
        .select('*, buyer:profiles!deliveries_buyer_id_fkey(full_name), seller:sellers(store_name)')
        .eq('rider_id', profile!.id)
        .order('delivered_at', { ascending: false })
        .limit(200)
      setDeliveries((data ?? []) as DeliveryRecord[])
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  const filtered = useMemo(() => {
    let result = deliveries
    if (statusFilter !== 'all') result = result.filter(d => d.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.pickup_address?.toLowerCase().includes(q) ||
        d.delivery_address?.toLowerCase().includes(q) ||
        (d as any).buyer?.full_name?.toLowerCase().includes(q) ||
        (d as any).seller?.store_name?.toLowerCase().includes(q)
      )
    }
    return result
  }, [deliveries, search, statusFilter])

  const stats = useMemo(() => {
    const delivered = deliveries.filter(d => d.status === 'delivered')
    const totalEarnings = delivered.reduce((s, d) => s + (d.delivery_fee || 0), 0)
    const avgDistance = delivered.length > 0
      ? delivered.reduce((s, d) => s + (d.distance_meters || 0), 0) / delivered.length / 1000
      : 0
    return {
      total: deliveries.length,
      delivered: delivered.length,
      cancelled: deliveries.filter(d => d.status === 'cancelled').length,
      totalEarnings,
      avgDistance: avgDistance.toFixed(1),
    }
  }, [deliveries])

  function exportCSV() {
    const header = 'Date,Pickup,Delivery,Status,Fee,Distance\n'
    const rows = filtered.map(d =>
      `${d.delivered_at ?? d.created_at},"${d.pickup_address}","${d.delivery_address}",${d.status},${d.delivery_fee},${d.distance_meters ?? ''}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'safari.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function getDuration(d: DeliveryRecord) {
    if (!d.accepted_at || !d.delivered_at) return null
    const mins = Math.round((new Date(d.delivered_at).getTime() - new Date(d.accepted_at).getTime()) / 60000)
    return mins < 60 ? `${mins}dak` : `${Math.floor(mins / 60)}s ${mins % 60}dak`
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-2xl text-white">{t('deliveryHistory', lang)}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{stats.total} {t('totalTrips', lang)}</p>
          </div>
          <button onClick={exportCSV} className="bg-neutral-800 text-neutral-300 font-semibold px-4 py-2 rounded-full text-sm inline-flex items-center gap-1.5 hover:bg-neutral-700 transition-colors">
            <Download className="w-4 h-4" /> {t('download', lang)}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-neutral-500">{t('total', lang)}</span>
            </div>
            <p className="font-display font-bold text-xl text-white">{stats.total}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-neutral-500">{t('completed', lang)}</span>
            </div>
            <p className="font-display font-bold text-xl text-white">{stats.delivered}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-neutral-500">{t('earnings', lang)}</span>
            </div>
            <p className="font-display font-bold text-xl text-white">{formatTZS(stats.totalEarnings)}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-neutral-500">{t('avgDistance', lang)}</span>
            </div>
            <p className="font-display font-bold text-xl text-white">{stats.avgDistance} km</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchTrips', lang)} className="bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 w-full" />
            </div>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-800">
            {(['all', 'delivered', 'cancelled'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>
                {s === 'all' ? t('allDeliveries', lang) : s === 'delivered' ? t('completed', lang) : t('cancelled', lang)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Package className="w-10 h-10" />} title={t('noTrips', lang)} description={t('noTripsDesc', lang)} />
        ) : (
          <div className="space-y-3">
            {filtered.map(d => (
              <div key={d.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                      d.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {d.status === 'delivered' ? t('completedStatus', lang) : t('cancelledStatus', lang)}
                    </span>
                    {d.rider_rating && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3" fill="currentColor" /> {d.rider_rating}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">{d.delivered_at ? formatDate(d.delivered_at) : formatDate(d.created_at)}</span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-300 truncate">{d.pickup_address}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-300 truncate">{d.delivery_address}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800">
                  <div className="flex items-center gap-3 text-neutral-500">
                    {d.distance_meters && <span>{(d.distance_meters / 1000).toFixed(1)} km</span>}
                    {getDuration(d) && <span>{getDuration(d)}</span>}
                    {(d as any).seller?.store_name && <span className="truncate max-w-[120px]">{(d as any).seller.store_name}</span>}
                  </div>
                  <span className="font-display font-bold text-brand-400">{formatTZS(d.delivery_fee)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

