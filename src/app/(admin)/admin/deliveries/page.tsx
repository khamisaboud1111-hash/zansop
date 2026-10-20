'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Truck, Star, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import LiveDeliveryMap from '@/components/delivery/LiveDeliveryMap'
import toast from 'react-hot-toast'

interface OnlineRider {
  rider_id: string
  full_name: string
  lat: number
  lng: number
  is_verified: boolean
  rating_average: number
  total_deliveries: number
  active_delivery_id: string | null
  active_delivery_status: string | null
}

interface DeliveryDetail {
  id: string
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number | null
  delivery_lng: number | null
}

export default function AdminDeliveriesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [riders, setRiders] = useState<OnlineRider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetail | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_online_riders')
    if (error) {
      console.error('Failed to load online riders:', error.message)
      toast.error('Imeshindikana kupakia madereva mtandaoni')
    }
    setRiders((data as OnlineRider[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
    const interval = setInterval(load, 20000)
    return () => clearInterval(interval)
  }, [load])

  async function viewDelivery(deliveryId: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select('id, pickup_location, delivery_location')
      .eq('id', deliveryId)
      .single()

    if (error || !data) {
      console.error('Failed to load delivery:', error?.message)
      toast.error('Imeshindikana kupakia maelezo ya usafirishaji')
      return
    }

    // pickup_location/delivery_location come back as GeoJSON via PostgREST.
    const pickupCoords = (data.pickup_location as any)?.coordinates
    const deliveryCoords = (data.delivery_location as any)?.coordinates

    setSelectedDelivery({
      id: data.id,
      pickup_lat: pickupCoords?.[1],
      pickup_lng: pickupCoords?.[0],
      delivery_lat: deliveryCoords?.[1] ?? null,
      delivery_lng: deliveryCoords?.[0] ?? null,
    })
  }

  if (loading) return <PageLoader />

  const activeCount = riders.filter((r) => r.active_delivery_id).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-xl text-ink-900 flex items-center gap-2">
          <Truck className="w-5 h-5" /> Ufuatiliaji wa Usafirishaji
        </h1>
        <button onClick={load} className="text-xs font-semibold text-ink-500 flex items-center gap-1.5 hover:text-ink-700">
          <RefreshCw className="w-3.5 h-3.5" /> Onyesha Upya
        </button>
      </div>

      <div className="flex gap-3 text-sm">
        <div className="card px-4 py-2.5">
          <span className="text-ink-500">Mtandaoni: </span>
          <strong className="text-ink-900">{riders.length}</strong>
        </div>
        <div className="card px-4 py-2.5">
          <span className="text-ink-500">Wanaosafirisha: </span>
          <strong className="text-emerald-600">{activeCount}</strong>
        </div>
      </div>

      {riders.length === 0 ? (
        <EmptyState icon={<Truck className="w-10 h-10" />} title="Hakuna dereva mtandaoni" description="Madereva watakapowaka mtandaoni wataonekana hapa" />
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-4">
          <div className="space-y-2">
            {riders.map((r) => (
              <button
                key={r.rider_id}
                onClick={() => r.active_delivery_id && viewDelivery(r.active_delivery_id)}
                disabled={!r.active_delivery_id}
                className={`w-full text-left card p-3.5 flex items-center justify-between transition-colors ${
                  r.active_delivery_id ? 'hover:border-brand-300 cursor-pointer' : 'opacity-60 cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${r.active_delivery_id ? 'bg-emerald-500 animate-pulse' : 'bg-ink-300'}`} />
                  <div>
                    <p className="font-semibold text-sm text-ink-900">{r.full_name}</p>
                    <p className="text-xs text-ink-500 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {(r.rating_average ?? 0).toFixed(1)} · {r.total_deliveries} safari
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-600">
                  {r.active_delivery_status === 'pending_dispatch' ? 'Ombi limetumwa' :
                   r.active_delivery_status === 'accepted' ? 'Anakwenda kuchukua' :
                   r.active_delivery_status === 'picked_up' ? 'Anasafirisha' : 'Bure'}
                </span>
              </button>
            ))}
          </div>

          <div>
            {selectedDelivery ? (
              <LiveDeliveryMap
                deliveryId={selectedDelivery.id}
                pickupLocation={{ lat: selectedDelivery.pickup_lat, lng: selectedDelivery.pickup_lng }}
                deliveryLocation={
                  selectedDelivery.delivery_lat && selectedDelivery.delivery_lng
                    ? { lat: selectedDelivery.delivery_lat, lng: selectedDelivery.delivery_lng }
                    : null
                }
              />
            ) : (
              <div className="h-[320px] sm:h-[420px] rounded-2xl border border-dashed border-ink-200 flex items-center justify-center text-sm text-ink-400 text-center px-4">
                Bonyeza dereva anayesafirisha ili kuona ramani ya safari yake moja kwa moja
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

