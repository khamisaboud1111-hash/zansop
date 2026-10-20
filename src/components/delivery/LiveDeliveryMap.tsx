'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { useDeliveryBroadcastSubscriber } from '@/hooks/useDeliveryBroadcast'

export interface LiveDeliveryMapProps {
  deliveryId: string
  pickupLocation: { lat: number; lng: number }
  deliveryLocation: { lat: number; lng: number } | null
  /** Last known DB location, used as the initial marker position before any broadcast arrives. */
  initialRiderLocation?: { lat: number; lng: number } | null
}

/**
 * For the buyer's order-tracking page and the admin monitoring screen.
 * Subscribes to the delivery's broadcast channel (published by the rider's
 * useRiderTracking hook) and smoothly moves the rider marker — no polling,
 * no page reload, zero extra API cost.
 */
export default function LiveDeliveryMap({ deliveryId, pickupLocation, deliveryLocation, initialRiderLocation }: LiveDeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const riderMarkerRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  useEffect(() => {
    let map: any

    async function init() {
      const L = (await import('leaflet')).default
      leafletRef.current = L
      if (!mapRef.current || leafletMapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([pickupLocation.lat, pickupLocation.lng], 13)
      leafletMapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const pickupIcon = L.divIcon({
        html: `<div style="background:#f97316;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: '', iconSize: [14, 14],
      })
      L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon }).addTo(map).bindPopup('Mahali pa Kuchukua')

      if (deliveryLocation) {
        const dropIcon = L.divIcon({
          html: `<div style="background:#1da8ab;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          className: '', iconSize: [14, 14],
        })
        L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: dropIcon }).addTo(map).bindPopup('Mahali pa Kufikisha')
      }

      const startPos = initialRiderLocation ?? pickupLocation
      const riderIcon = L.divIcon({
        html: `<div style="position:relative;width:22px;height:22px;">
                 <div style="position:absolute;inset:0;background:rgba(29,168,171,0.35);border-radius:50%;animation:pulse-ring 1.6s ease-out infinite;"></div>
                 <div style="position:absolute;top:2px;left:2px;background:#1da8ab;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px rgba(29,168,171,0.4)"></div>
               </div>
               <style>@keyframes pulse-ring{0%{transform:scale(0.8);opacity:1}100%{transform:scale(2.2);opacity:0}}</style>`,
        className: '',
        iconSize: [22, 22],
      })
      riderMarkerRef.current = L.marker([startPos.lat, startPos.lng], { icon: riderIcon }).addTo(map).bindPopup('Dereva')
    }

    init()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useDeliveryBroadcastSubscriber(deliveryId, (payload) => {
    setLastUpdate(payload.ts)
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([payload.lat, payload.lng])
    }
    if (leafletMapRef.current) {
      leafletMapRef.current.panTo([payload.lat, payload.lng], { animate: true })
    }
  })

  const secondsSinceUpdate = lastUpdate ? Math.round((Date.now() - lastUpdate) / 1000) : null

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 z-0" />
      <div className="absolute top-3 right-3 bg-white/95 dark:bg-ink-900/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium shadow-card z-10">
        {lastUpdate ? (
          <span className="text-emerald-600 dark:text-emerald-400">● Moja kwa moja {secondsSinceUpdate !== null && secondsSinceUpdate > 2 ? `(${secondsSinceUpdate}s)` : ''}</span>
        ) : (
          <span className="text-ink-400 dark:text-ink-500">○ Inasubiri taarifa za dereva...</span>
        )}
      </div>
    </div>
  )
}

