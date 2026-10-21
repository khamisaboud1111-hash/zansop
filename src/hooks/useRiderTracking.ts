'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDeliveryBroadcastPublisher } from './useDeliveryBroadcast'

export interface ActiveOffer {
  id: string
  pickup_address: string
  delivery_address: string
  delivery_fee: number
  distance_meters: number | null
  timeout_expires_at: string | null
  status: string
}

/**
 * Manages a rider's online/offline state, periodic GPS pings while online,
 * listens for incoming delivery offers via Supabase Realtime + a client-side
 * timeout poller (see Phase 9 notes on zero-budget dispatch), and tracks
 * whichever delivery is currently accepted/picked_up so its location can be
 * broadcast live to the buyer/admin tracking map (Phase 11).
 */
export function useRiderTracking(riderId: string | undefined) {
  const supabase = useMemo(() => createClient(), [])
  const [isOnline, setIsOnline] = useState(false)
  const [offer, setOffer] = useState<ActiveOffer | null>(null)
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { publish } = useDeliveryBroadcastPublisher(activeDeliveryId)

  const pingLocation = useCallback(
    (lat: number, lng: number, heading?: number | null) => {
      fetch('/api/rider/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      }).catch(() => {})

      if (activeDeliveryId) {
        publish({ lat, lng, heading, ts: Date.now() })
      }
    },
    [activeDeliveryId, publish]
  )

  // Start/stop GPS watch when online status flips.
  useEffect(() => {
    if (!isOnline || !riderId) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }
    if (!('geolocation' in navigator)) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => pingLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.heading),
      (err) => console.warn('[useRiderTracking] geolocation error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [isOnline, riderId, pingLocation])

  // Load the delivery the rider is already working on.
  // The realtime listener below only fires on a row change, so without this
  // the active job is missing on every page load and after a refresh: the
  // rider sees no trip and cannot pick up or deliver it.
  useEffect(() => {
    if (!riderId) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('id, status')
        .eq('rider_id', riderId)
        .in('status', ['accepted', 'picked_up'])
        .order('updated_at', { ascending: false })
        .limit(1)
      if (cancelled) return
      const row = (data ?? [])[0] as { id: string; status: string } | undefined
      setActiveDeliveryId(row?.id ?? null)
    })()
    return () => { cancelled = true }
  }, [riderId, supabase])

  // Realtime: listen for deliveries assigned to this rider.
  useEffect(() => {
    if (!riderId) return

    const channel = supabase
      .channel(`rider-offers-${riderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries', filter: `rider_id=eq.${riderId}` },
        (payload: { new: unknown }) => {
          const row = payload.new as ActiveOffer
          if (row.status === 'pending_dispatch') {
            setOffer(row)
          } else {
            setOffer((current) => (current?.id === row.id ? null : current))
          }

          if (row.status === 'accepted' || row.status === 'picked_up') {
            setActiveDeliveryId(row.id)
          } else if (row.status === 'delivered' || row.status === 'cancelled' || row.status === 'declined') {
            setActiveDeliveryId((current) => (current === row.id ? null : current))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [riderId, supabase])

  // Client-side timeout poller — checks the active offer every 4s. This is
  // the zero-budget stand-in for a server cron job (see Phase 9 notes).
  useEffect(() => {
    if (!offer?.id) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/delivery/check-timeout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_id: offer.id }),
        })
        const json = await res.json()
        if (json.expired) setOffer(null)
      } catch {
        // ignore transient network errors, next tick will retry
      }
    }, 4000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [offer?.id])

  async function toggleOnline(next: boolean) {
    if (!riderId) return
    const { error } = await supabase.from('rider_profiles').update({ is_online: next }).eq('id', riderId)
    if (!error) setIsOnline(next)
    return !error
  }

  async function acceptOffer() {
    if (!offer) return false
    const res = await fetch('/api/delivery/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id: offer.id }),
    })
    if (res.ok) {
      setOffer(null)
      return true
    }
    return false
  }

  async function declineOffer() {
    if (!offer) return false
    await fetch('/api/delivery/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_id: offer.id }),
    })
    setOffer(null)
    return true
  }

  return { isOnline, setIsOnline, toggleOnline, offer, acceptOffer, declineOffer, activeDeliveryId }
}

