'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bike, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface ReadyForPickupButtonProps {
  orderId: string
  sellerId: string
  sellerLatitude: number | null
  sellerLongitude: number | null
  sellerAddress: string
  deliveryAddress: string
  suggestedFee: number
}

interface DispatchState {
  deliveryId: string | null
  status: 'idle' | 'searching' | 'pending_dispatch' | 'accepted' | 'picked_up' | 'delivered' | 'no_rider'
}

export default function ReadyForPickupButton({
  orderId,
  sellerId,
  sellerLatitude,
  sellerLongitude,
  sellerAddress,
  deliveryAddress,
  suggestedFee,
}: ReadyForPickupButtonProps) {
  const supabase = useMemo(() => createClient(), [])
  const [dispatch, setDispatch] = useState<DispatchState>({ deliveryId: null, status: 'idle' })
  const [fee, setFee] = useState(suggestedFee || 2000)

  // Watch for status changes on this order's delivery row in real time.
  useEffect(() => {
    if (!dispatch.deliveryId) return

    const channel = supabase
      .channel(`delivery-status-${dispatch.deliveryId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliveries', filter: `id=eq.${dispatch.deliveryId}` },
        (payload) => {
          const status = (payload.new as { status: DispatchState['status'] }).status
          setDispatch((d) => ({ ...d, status }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch.deliveryId, supabase])

  // Client-side timeout poller, same zero-budget pattern as the rider dashboard.
  useEffect(() => {
    if (dispatch.status !== 'pending_dispatch' || !dispatch.deliveryId) return

    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/delivery/check-timeout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_id: dispatch.deliveryId }),
        })
        const json = await res.json()
        if (json.expired && !json.rider_found) {
          setDispatch((d) => ({ ...d, status: 'no_rider' }))
        }
        // If a new rider was found, the postgres_changes listener above will
        // catch the updated row (still pending_dispatch with a new rider_id).
      } catch {
        // ignore, next tick retries
      }
    }, 4000)

    return () => clearInterval(id)
  }, [dispatch.status, dispatch.deliveryId])

  async function handleDispatch() {
    if (!sellerLatitude || !sellerLongitude) {
      toast.error('Weka eneo la duka lako kwanza (latitude/longitude) kabla ya kutafuta dereva')
      return
    }

    setDispatch({ deliveryId: null, status: 'searching' })

    try {
      const res = await fetch('/api/delivery/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          seller_id: sellerId,
          pickup_lat: sellerLatitude,
          pickup_lng: sellerLongitude,
          pickup_address: sellerAddress,
          delivery_address: deliveryAddress,
          delivery_fee: fee,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Imeshindikana kutuma ombi')
        setDispatch({ deliveryId: null, status: 'idle' })
        return
      }

      setDispatch({
        deliveryId: json.delivery.id,
        status: json.rider_found ? 'pending_dispatch' : 'no_rider',
      })

      if (!json.rider_found) {
        toast.error('Hakuna dereva aliyepo mtandaoni kwa sasa. Tutaendelea kutafuta.')
      }
    } catch {
      toast.error('Hitilafu ya mtandao')
      setDispatch({ deliveryId: null, status: 'idle' })
    }
  }

  if (dispatch.status === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={fee}
          onChange={(e) => setFee(Number(e.target.value))}
          className="input text-xs w-24 py-2"
          min={0}
          step={500}
        />
        <Button onClick={handleDispatch} className="flex-1" size="sm">
          <Bike className="w-4 h-4" /> Tafuta Dereva
        </Button>
      </div>
    )
  }

  if (dispatch.status === 'searching') {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-600">
        <Loader2 className="w-4 h-4 animate-spin" /> Tunatafuta dereva...
      </div>
    )
  }

  if (dispatch.status === 'pending_dispatch') {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-3 py-2 rounded-xl">
        <Loader2 className="w-4 h-4 animate-spin" /> Ombi limetumwa kwa dereva, tunasubiri jibu...
      </div>
    )
  }

  if (dispatch.status === 'no_rider') {
    return (
      <div className="flex items-center justify-between gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
        <span className="flex items-center gap-2"><XCircle className="w-4 h-4" /> Hakuna dereva kwa sasa</span>
        <button onClick={handleDispatch} className="text-xs font-semibold underline">Jaribu Tena</button>
      </div>
    )
  }

  if (dispatch.status === 'accepted' || dispatch.status === 'picked_up') {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
        <CheckCircle2 className="w-4 h-4" /> Dereva amekubali — {dispatch.status === 'picked_up' ? 'amechukua bidhaa' : 'anakuja kuchukua'}
      </div>
    )
  }

  return null
}

