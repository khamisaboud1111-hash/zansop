'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DeliveryLocationPayload {
  lat: number
  lng: number
  heading?: number | null
  ts: number
}

/**
 * Rider side: publishes lat/lng to a per-delivery broadcast channel every
 * time it's called. Pair with navigator.geolocation.watchPosition.
 * This is separate from the DB write in useRiderTracking (which updates
 * rider_profiles.current_location for the dispatch RPC) — broadcast is for
 * smooth, zero-DB-roundtrip live animation on the watching side.
 */
export function useDeliveryBroadcastPublisher(deliveryId: string | null) {
  const supabase = useMemo(() => createClient(), [])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!deliveryId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    const channel = supabase.channel(`delivery-track-${deliveryId}`, {
      config: { broadcast: { self: false } },
    })
    channel.subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [deliveryId, supabase])

  function publish(payload: DeliveryLocationPayload) {
    channelRef.current?.send({ type: 'broadcast', event: 'location', payload })
  }

  return { publish }
}

/**
 * Watcher side (buyer's order tracking page, or admin monitoring screen):
 * subscribes to the same per-delivery channel and calls onLocation whenever
 * a new broadcast arrives, so the map marker can animate without a reload.
 */
export function useDeliveryBroadcastSubscriber(
  deliveryId: string | null,
  onLocation: (payload: DeliveryLocationPayload) => void
) {
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!deliveryId) return

    const channel = supabase
      .channel(`delivery-track-${deliveryId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'location' }, ({ payload }) => {
        onLocation(payload as DeliveryLocationPayload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId])
}

