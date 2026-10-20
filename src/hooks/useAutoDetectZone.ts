'use client'

import { useState, useCallback } from 'react'
import type { DeliveryZone } from '@/types'

const ZONE_CENTERS: Record<DeliveryZone, { lat: number; lng: number }> = {
  stone_town: { lat: -6.1659, lng: 39.2026 },
  north_zanzibar: { lat: -5.746, lng: 39.285 },
  south_zanzibar: { lat: -6.45, lng: 39.45 },
  east_zanzibar: { lat: -6.275, lng: 39.6 },
  west_zanzibar: { lat: -6.15, lng: 39.15 },
  pemba_island: { lat: -5.15, lng: 39.75 },
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestZone(lat: number, lng: number): DeliveryZone {
  let best: DeliveryZone = 'stone_town'
  let bestDist = Infinity
  for (const [zone, center] of Object.entries(ZONE_CENTERS) as Array<[DeliveryZone, { lat: number; lng: number }]>) {
    const d = haversine(lat, lng, center.lat, center.lng)
    if (d < bestDist) {
      bestDist = d
      best = zone
    }
  }
  return best
}

export function useAutoDetectZone() {
  const [detecting, setDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const detect = useCallback(
    (onDetected: (zone: DeliveryZone) => void) => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported')
        return
      }
      setDetecting(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setCoords({ lat: latitude, lng: longitude })
          const zone = nearestZone(latitude, longitude)
          onDetected(zone)
          setDetecting(false)
        },
        (err) => {
          setError(err.message === 'User denied Geolocation' ? 'Ruhusa ya GPS imekataliwa' : err.message)
          setDetecting(false)
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      )
    },
    []
  )

  return { detecting, error, coords, detect, nearestZone }
}

