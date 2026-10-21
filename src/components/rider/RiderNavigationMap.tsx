'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import toast from 'react-hot-toast'
import { Navigation, Compass, Phone, MessageSquare, MapPin, AlertCircle, RefreshCw } from 'lucide-react'

interface RiderNavigationMapProps {
  riderLocation: { lat: number; lng: number } | null
  pickupLocation: { lat: number; lng: number }
  deliveryLocation: { lat: number; lng: number } | null
  leg: 'to_pickup' | 'to_delivery'
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  deliveryNotes?: string
}

interface RoutingStep {
  text: string
  distance: number
}

interface RoutingSummary {
  totalTime: number
  totalDistance: number
}

interface RoutingRoute {
  summary: RoutingSummary
  instructions: RoutingStep[]
}

interface RoutesFoundEvent {
  routes: RoutingRoute[]
}

interface RoutingControlInstance {
  remove(): void
  on(event: string, callback: (e: RoutesFoundEvent) => void): this
}

export function RiderNavigationMap({
  riderLocation,
  pickupLocation,
  deliveryLocation,
  leg,
  customerName,
  customerPhone,
  customerAddress,
  deliveryNotes,
}: RiderNavigationMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const routingControlRef = useRef<RoutingControlInstance | null>(null)
  
  const riderMarkerRef = useRef<L.Marker | null>(null)
  const pickupMarkerRef = useRef<L.Marker | null>(null)
  const deliveryMarkerRef = useRef<L.Marker | null>(null)

  const [isFollowing, setIsFollowing] = useState(true)
  const [etaText, setEtaText] = useState<string | null>(null)
  const [distanceText, setDistanceText] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<Array<{ text: string; distance: number }>>([])
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [routeError, setRouteError] = useState(false)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)

  const activeDestination = leg === 'to_pickup' ? pickupLocation : deliveryLocation || pickupLocation

  const riderIcon = useMemo(
    () =>
      L.divIcon({
        className: 'rider-live-marker',
        html: '<div style="background-color: #0284c7; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(2,132,199,0.7); animation: pulse 1.5s infinite;"></div>',
        iconSize: [18, 18],
      }),
    []
  )

  const pickupIcon = useMemo(
    () =>
      L.divIcon({
        className: 'pickup-pin',
        html: '<div style="background-color: #f97316; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [14, 14],
      }),
    []
  )

  const deliveryIcon = useMemo(
    () =>
      L.divIcon({
        className: 'delivery-pin',
        html: '<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [14, 14],
      }),
    []
  )

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const map = L.map(mapRef.current, { zoomControl: false }).setView(
      [pickupLocation.lat, pickupLocation.lng],
      15
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)

    L.control.zoom({ position: 'topright' }).addTo(map)

    pickupMarkerRef.current = L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup('Mahali pa Kuchukua Bidhaa')

    if (deliveryLocation) {
      deliveryMarkerRef.current = L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: deliveryIcon })
        .addTo(map)
        .bindPopup('Mahali pa Kufikisha Bidhaa')
    }

    leafletMapRef.current = map

    return () => {
      map.remove()
      leafletMapRef.current = null
      routingControlRef.current = null
      riderMarkerRef.current = null
      pickupMarkerRef.current = null
      deliveryMarkerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = leafletMapRef.current
    if (!map) return

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickupLocation.lat, pickupLocation.lng])
    }

    if (deliveryLocation && deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng([deliveryLocation.lat, deliveryLocation.lng])
    }
  }, [pickupLocation, deliveryLocation])

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setGpsAccuracy(Math.round(pos.coords.accuracy)),
      () => setGpsAccuracy(null),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // The destination is compared by value, not by object identity. The parent
  // builds a new object for the pickup/drop-off coordinates on every render,
  // so comparing the objects re-ran the routing request on every render of
  // the dashboard - it removed and re-added the routing control while a
  // request was still in flight, which is what pushed the map into an error
  // state and took the rider's screen down with it.
  const destLat = activeDestination?.lat
  const destLng = activeDestination?.lng
  const startLat = riderLocation?.lat ?? pickupLocation.lat
  const startLng = riderLocation?.lng ?? pickupLocation.lng

  const lastRoutedDestRef = useRef<{ lat: number; lng: number } | null>(null)
  const lastRiderPosRef = useRef<{ lat: number; lng: number } | null>(null)

  const calculateRoute = useCallback((start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const map = leafletMapRef.current
    if (!map) return

    setIsCalculatingRoute(true)
    setRouteError(false)

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current as any)
      routingControlRef.current = null
    }

    try {
      const routingControl = (L as any).Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
        }),
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,
        lineOptions: {
          styles: [{ color: '#f97316', weight: 5, opacity: 0.8 }],
        },
        createMarker: () => null,
      })

      routingControl.on('routesfound', (e: RoutesFoundEvent) => {
        // The map can be torn down while the route request is still running.
        // Updating state after that throws inside React and takes the page
        // down, so the result is dropped instead.
        if (!leafletMapRef.current) return
        setIsCalculatingRoute(false)
        const summary = e.routes[0]?.summary
        if (summary) {
          const mins = Math.round(summary.totalTime / 60)
          const km = (summary.totalDistance / 1000).toFixed(1)
          setEtaText(`${mins} min`)
          setDistanceText(`${km} km`)
        }

        const steps = e.routes[0]?.instructions || []
        setInstructions(
          steps.slice(0, 3).map((step: RoutingStep) => ({
            text: step.text,
            distance: step.distance,
          }))
        )
      })

      routingControl.on('routingerror', () => {
        if (!leafletMapRef.current) return
        setIsCalculatingRoute(false)
        setRouteError(true)
        if (process.env.NODE_ENV === 'development') {
          console.error('Routing error occurred')
        }
      })

      routingControl.addTo(map)
      routingControlRef.current = routingControl
      lastRoutedDestRef.current = end
      lastRiderPosRef.current = start
    } catch (err) {
      setIsCalculatingRoute(false)
      setRouteError(true)
    }
  }, [])

  useEffect(() => {
    if (destLat === undefined || destLng === undefined) return

    const startPoint = { lat: startLat, lng: startLng }
    const endPoint = { lat: destLat, lng: destLng }

    const hasDestinationChanged =
      !lastRoutedDestRef.current ||
      lastRoutedDestRef.current.lat !== endPoint.lat ||
      lastRoutedDestRef.current.lng !== endPoint.lng

    const hasSignificantDeviation =
      !lastRiderPosRef.current ||
      !routingControlRef.current ||
      Math.abs(lastRiderPosRef.current.lat - startPoint.lat) > 0.0004 ||
      Math.abs(lastRiderPosRef.current.lng - startPoint.lng) > 0.0004

    if (hasDestinationChanged || hasSignificantDeviation) {
      calculateRoute(startPoint, endPoint)
    }
  }, [startLat, startLng, destLat, destLng, calculateRoute])

  useEffect(() => {
    const map = leafletMapRef.current
    if (!map || !riderLocation) return

    if (!riderMarkerRef.current) {
      riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], { icon: riderIcon })
        .addTo(map)
        .bindPopup('Eneo lako la sasa')
    } else {
      riderMarkerRef.current.setLatLng([riderLocation.lat, riderLocation.lng])
    }

    if (isFollowing) {
      const bounds = map.getBounds()
      const currentLatLng = L.latLng(riderLocation.lat, riderLocation.lng)
      if (!bounds.contains(currentLatLng)) {
        map.panTo(currentLatLng, { animate: true })
      }
    }
  }, [riderLocation, isFollowing, riderIcon])

  const openExternalNav = (provider: 'google' | 'waze') => {
    const dest = activeDestination
    const url =
      provider === 'google'
        ? `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`
        : `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`
    window.open(url, '_blank')
  }

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-card border border-ink-100 dark:border-ink-800">
      <div ref={mapRef} className="w-full h-full z-10" />

      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-ink-100 dark:border-ink-800 pointer-events-auto">
            <span className="text-xl">🛵</span>
            <div>
              <p className="font-display font-bold text-ink-900 dark:text-white text-xs leading-tight">
                {isCalculatingRoute ? 'Inaleta ramani...' : etaText || 'Hesabu...'}
              </p>
              <p className="text-[10px] text-ink-500 dark:text-ink-400">{distanceText || 'Mbali'}</p>
            </div>
          </div>

          {gpsAccuracy !== null && (
            <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold backdrop-blur-md shadow-md border pointer-events-auto flex items-center gap-1 ${
              gpsAccuracy <= 15 ? 'bg-emerald-500/90 text-white border-emerald-600' : 'bg-amber-500/90 text-white border-amber-600'
            }`}>
              <Compass className="w-3 h-3 animate-spin" />
              GPS ±{gpsAccuracy}m
            </div>
          )}
        </div>

        {routeError && (
          <div className="flex items-center justify-between bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs shadow-lg pointer-events-auto">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Imeshindikana kuhesabu njia.
            </span>
            <button
              onClick={() => calculateRoute(riderLocation || pickupLocation, activeDestination)}
              className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Jaribu Tena
            </button>
          </div>
        )}

        {instructions.length > 0 && !routeError && (
          <div className="bg-white/95 dark:bg-ink-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-ink-100 dark:border-ink-800 pointer-events-auto flex items-center gap-3">
            <Navigation className="w-5 h-5 text-brand-500 flex-shrink-0 animate-pulse" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-ink-900 dark:text-white truncate">{instructions[0].text}</p>
              <p className="text-[10px] text-ink-500 dark:text-ink-400">Baada ya mita {instructions[0].distance}</p>
            </div>
          </div>
        )}
      </div>

      {(customerName || customerPhone || customerAddress || deliveryNotes) && (
        <div className="absolute bottom-16 left-3 right-3 z-20 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-ink-100 dark:border-ink-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-ink-900 dark:text-white flex items-center gap-1">
                👤 {customerName || 'Mteja'}
              </p>
              {customerAddress && (
                <p className="text-ink-500 dark:text-ink-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-brand-500" /> {customerAddress}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {customerPhone && (
                <>
                  <a
                    href={`tel:${customerPhone}`}
                    className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-lg shadow transition-colors flex items-center justify-center"
                    title="Piga Simu"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`sms:${customerPhone}`}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg shadow transition-colors flex items-center justify-center"
                    title="Chati"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {deliveryNotes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-2 rounded-lg text-amber-800 dark:text-amber-300 text-[11px]">
              <span className="font-semibold">Ujumbe maalum:</span> {deliveryNotes}
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={() => openExternalNav('google')}
          className="bg-white dark:bg-ink-900 hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border border-ink-200 dark:border-ink-700 transition-colors"
        >
          Google Maps
        </button>
        <button
          onClick={() => openExternalNav('waze')}
          className="bg-white dark:bg-ink-900 hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border border-ink-200 dark:border-ink-700 transition-colors"
        >
          Waze
        </button>
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          aria-pressed={isFollowing}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-colors ${
            isFollowing
              ? 'bg-brand-500 text-white'
              : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-200 border border-ink-200 dark:border-ink-700'
          }`}
        >
          {isFollowing ? 'Inafuata GPS' : 'Mtazamo Huru'}
        </button>
      </div>
    </div>
  )
}

