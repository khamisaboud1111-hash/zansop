'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Navigation, MapPin, Clock, Package, Zap, Star, Filter, X, Users } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import { cn } from '@/utils'
import { formatTZS } from '@/utils'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import toast from 'react-hot-toast'

interface AvailableDelivery {
  id: string
  pickup_address: string
  delivery_address: string
  delivery_fee: number
  distance_meters: number | null
  estimated_arrival?: string
  customer_name?: string
  customer_rating?: number
  delivery_type: 'express' | 'standard'
  created_at: string
  status: 'pending_dispatch'
}

type FilterType = 'all' | 'express' | 'standard' | 'nearest'

export default function RiderAvailablePage() {
  const supabase = useMemo(() => createClient(), [])
  const { profile, loading: userLoading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const [deliveries, setDeliveries] = useState<AvailableDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        )
      }

      // The job board is the unassigned deliveries waiting for a rider.
      // The status value is 'pending_dispatch' (the delivery_status enum has
      // no 'available'), and the customer name comes from the order - there
      // is no customer_name column on deliveries.
      const { data } = await supabase
        .from('deliveries')
        .select('id, pickup_address, delivery_address, delivery_fee, distance_meters, created_at, status, delivery_type, order:orders!deliveries_order_id_fkey(delivery_name, buyer:profiles(full_name))')
        .eq('status', 'pending_dispatch')
        .is('rider_id', null)
        .order('created_at', { ascending: false })
        .limit(50)
      setDeliveries(((data ?? []) as any[]).map((d) => ({
        ...d,
        customer_name: d.order?.buyer?.full_name ?? d.order?.delivery_name ?? undefined,
      })) as AvailableDelivery[])
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  const filtered = useMemo(() => {
    let result = deliveries

    if (filter !== 'all' && filter !== 'nearest') {
      result = result.filter(d => d.delivery_type === filter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.pickup_address.toLowerCase().includes(q) ||
        d.delivery_address.toLowerCase().includes(q)
      )
    }

    if (filter === 'nearest' && userLocation && deliveries.length > 0) {
      result = result.sort((a, b) => {
        const distA = a.distance_meters || 0
        const distB = b.distance_meters || 0
        return distA - distB
      })
    }

    return result
  }, [deliveries, filter, search, userLocation])

  const stats = useMemo(() => {
    return {
      total: deliveries.length,
      express: deliveries.filter(d => d.delivery_type === 'express').length,
      standard: deliveries.filter(d => d.delivery_type === 'standard').length,
      today: deliveries.filter(d => {
        const today = new Date().toISOString().slice(0, 10)
        return d.created_at.startsWith(today)
      }).length,
    }
  }, [deliveries])

  async function requestDelivery(deliveryId: string) {
    if (!profile) return
    try {
      // claim_delivery locks the row and assigns it atomically, so two
      // riders cannot both take the same job.
      const { error } = await supabase.rpc('claim_delivery', { p_delivery_id: deliveryId })
      if (error) throw error
      setDeliveries(prev => prev.filter(d => d.id !== deliveryId))
      toast.success(t('deliveryAccepted', lang))
    } catch {
      toast.error(t('failedToAcceptDelivery', lang))
    }
  }

  function getDistanceDisplay(distance: number | null): string {
    if (!distance) return '—'
    if (distance < 1000) return `${distance}m`
    return `${(distance / 1000).toFixed(1)} km`
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="font-display font-black text-2xl text-white">{t('availableDeliveries', lang)}</h1>
          <p className="text-sm text-neutral-500 mt-1">{stats.total} {t('deliveriesAvailable', lang)}</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPickupDelivery', lang)}
                className="bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'express', 'standard', 'nearest'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-semibold transition-colors',
                    filter === f ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  )}>
                  {f === 'all' ? t('all', lang) : f === 'express' ? 'Express' : f === 'standard' ? 'Standard' : 'Nearest'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="w-10 h-10" />}
            title={t('noDeliveries', lang)}
            description={t('noDeliveriesDesc', lang)}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(delivery => (
              <div key={delivery.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-colors">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${delivery.delivery_type === 'express' ? 'bg-brand-500/20 text-brand-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {delivery.delivery_type === 'express' ? 'Express' : 'Standard'}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {delivery.estimated_arrival || 'Soon'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-neutral-500 font-semibold uppercase">{t('pickup', lang)}</p>
                        <p className="text-sm font-medium text-white truncate">{delivery.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Navigation className="w-3 h-3 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-neutral-500 font-semibold uppercase">{t('delivery', lang)}</p>
                        <p className="text-sm font-medium text-white truncate">{delivery.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {delivery.distance_meters && (
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> {getDistanceDisplay(delivery.distance_meters)}
                        </span>
                      )}
                    </div>
                    <span className="font-display font-bold text-brand-400">{formatTZS(delivery.delivery_fee)}</span>
                  </div>

                  {delivery.customer_name && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
                      <Users className="w-3 h-3" />
                      <span>{delivery.customer_name}</span>
                      {delivery.customer_rating && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-current" /> {delivery.customer_rating}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => requestDelivery(delivery.id)}
                      className="bg-white text-black font-semibold flex-1 justify-center py-3 rounded-full text-sm gap-1.5 hover:bg-neutral-200 transition-colors flex items-center"
                    >
                      <Zap className="w-4 h-4" /> {t('accept', lang)}
                    </button>
                    <button className="bg-neutral-800 text-neutral-300 font-semibold px-4 py-3 rounded-full text-sm hover:bg-neutral-700 transition-colors">
                      {t('details', lang)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

