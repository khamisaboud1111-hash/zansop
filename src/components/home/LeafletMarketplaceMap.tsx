'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { Maximize, Minimize, MapPin, Satellite, Layers, Home, Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

export interface SellerPin {
  id: string
  store_name: string
  store_slug: string
  logo_url: string | null
  average_rating: number
  location_label: string | null
  latitude: number
  longitude: number
}

export interface LeafletMapHandle {
  refresh: () => void
  flyToZanzibar: () => void
}

// Main island (Unguja) is the primary view. The archipelago bounds below only
// cap how far the user can pan, so Pemba stays reachable to the north.
const UNGUJA_BOUNDS: [[number, number], [number, number]] = [
  [-6.55, 39.02],
  [-5.68, 39.62],
]
const ARCHIPELAGO_BOUNDS: [[number, number], [number, number]] = [
  [-6.9, 38.9],
  [-4.6, 39.9],
]
const ZANZIBAR_CENTER: [number, number] = [-6.1659, 39.2026]

type LayerKey = 'streets' | 'satellite'

const LeafletMarketplaceMap = forwardRef<LeafletMapHandle, { pins: SellerPin[]; fill?: boolean }>(
  function LeafletMarketplaceMap({ pins, fill = false }, ref) {
    const mapRef = useRef<HTMLDivElement | null>(null)
    const leafletMapRef = useRef<any>(null)
    const streetsLayerRef = useRef<any>(null)
    const satelliteLayerRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const userMarkerRef = useRef<any>(null)
    const [layer, setLayer] = useState<LayerKey>('streets')
    const [tilesReady, setTilesReady] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)

useEffect(() => {
      let map: any
      let streetsLayer: any
      let satelliteLayer: any

      async function init() {
        const L = (await import('leaflet')).default
        if (!mapRef.current || leafletMapRef.current) return

        map = L.map(mapRef.current, {
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          zoomControl: false,
          minZoom: 9,
          maxZoom: 19,
          maxBounds: ARCHIPELAGO_BOUNDS,
          maxBoundsViscosity: 0.8,
          preferCanvas: true, // Use canvas renderer for better performance
        })
        leafletMapRef.current = map

        // Primary: OpenStreetMap (completely free, no API key, no rate limits)
        const primaryLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
            subdomains: 'abc',
            crossOrigin: true, // Enable cross-origin for better caching
          }
        ).addTo(map)

        // Backup 1: OpenStreetMap Humanitarian (high contrast, completely free)
        const backupLayer1 = L.tileLayer(
          'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.openstreetmap.fr/">OpenStreetMap France</a>',
            maxZoom: 20,
            subdomains: 'abc',
          }
        )

        // Backup 2: OpenTopoMap (topographic, free)
        const backupLayer2 = L.tileLayer(
          'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
            maxZoom: 17,
            subdomains: 'abc',
          }
        )

        // Satellite: Esri World Imagery (free for non-commercial)
        satelliteLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri | Source: Esri, Maxar, Earthstar Geographics',
            maxZoom: 19,
            maxNativeZoom: 17,
          }
        )

        streetsLayer = primaryLayer.addTo(map)
        streetsLayerRef.current = primaryLayer
        satelliteLayerRef.current = satelliteLayer

        // Robust fallback chain: primary -> backup1 -> backup2
        const layers = [primaryLayer, backupLayer1, backupLayer2]
        let currentLayerIndex = 0

        const handleTileError = (err: any, layerIndex: number) => {
          if (layerIndex < layers.length - 1) {
            console.warn(`Tile layer ${layerIndex} failed, falling back to ${layerIndex + 1}`)
            map.removeLayer(layers[layerIndex])
            const nextLayer = layers[layerIndex + 1].addTo(map)
            streetsLayerRef.current = nextLayer
          } else {
            console.error('All tile layers failed')
            setNotice('Imeshindikana kupakia ramani. Jaribu tena baadaye.')
          }
        }

        primaryLayer.on('tileerror', (err: any) => handleTileError(err, 0))
        backupLayer1.on('tileerror', (err: any) => handleTileError(err, 1))
        backupLayer2.on('tileerror', (err: any) => handleTileError(err, 2))

        // Hide loading indicator once tiles load
        primaryLayer.on('load', () => setTilesReady(true))
        backupLayer1.on('load', () => setTilesReady(true))
        backupLayer2.on('load', () => setTilesReady(true))
        satelliteLayer.on('load', () => setTilesReady(true))
        setTimeout(() => setTilesReady(true), 8000)

        // Initial view
        if (mapRef.current.clientHeight > 0) {
          map.fitBounds(UNGUJA_BOUNDS)
        } else {
          map.setView(ZANZIBAR_CENTER, 10)
        }

        L.control.zoom({ position: 'topleft' }).addTo(map)
        L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)

        // Seller pins
        pins.forEach((pin) => {
          const initial = (pin.store_name.trim()[0] || 'S').toUpperCase()
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:26px;height:26px;border-radius:50%;background:#14b8a6;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;transform:translateY(-7px)">${initial}</div>`,
            iconSize: [26, 34],
            iconAnchor: [13, 34],
          })
          const marker = L.marker([pin.latitude, pin.longitude], { icon }).addTo(map)
          marker.bindPopup(
            `<div style="min-width:160px">
              <div style="font-weight:700;font-size:13px;margin-bottom:2px">${escapeHtml(pin.store_name)}</div>
              <div style="font-size:12px;color:#777;margin-bottom:6px">⭐ ${pin.average_rating?.toFixed(1) ?? '0.0'}${pin.location_label ? ' 📍 ' + escapeHtml(pin.location_label) : ''}</div>
              <a href="/sellers/${pin.store_slug}" style="font-size:12px;font-weight:600;color:#1da8ab">Tembelea Duka →</a>
            </div>`
          )
        })

        setTimeout(() => map.invalidateSize(), 120)
        setTimeout(() => map.invalidateSize(), 500)
      }

      init()

      return () => {
        if (leafletMapRef.current) {
          leafletMapRef.current.remove()
          leafletMapRef.current = null
        }
      }
    }, [pins])

    useImperativeHandle(ref, () => ({
      refresh() {
        const map = leafletMapRef.current
        if (!map) return
        map.invalidateSize()
        setTimeout(() => map.fitBounds(UNGUJA_BOUNDS), 80)
      },
      flyToZanzibar() {
        leafletMapRef.current?.flyToBounds(UNGUJA_BOUNDS)
      },
    }))

    // Swap between the real street map and real satellite imagery.
    useEffect(() => {
      const map = leafletMapRef.current
      if (!map) return
      if (layer === 'satellite') {
        streetsLayerRef.current?.remove()
        satelliteLayerRef.current?.addTo(map)
      } else {
        satelliteLayerRef.current?.remove()
        streetsLayerRef.current?.addTo(map)
      }
    }, [layer])

    function resetView() {
      leafletMapRef.current?.flyToBounds(UNGUJA_BOUNDS)
    }

    async function toggleFullscreen() {
      if (typeof document === 'undefined') return
      const el = containerRef.current
      if (!el) return
      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen()
          setIsFullscreen(true)
        } else {
          await document.exitFullscreen()
          setIsFullscreen(false)
        }
        setTimeout(() => leafletMapRef.current?.invalidateSize(), 120)
      } catch {
        // Fullscreen can be denied by the browser — fail silently.
      }
    }

    function locateMe() {
      const map = leafletMapRef.current
      if (!map || typeof navigator === 'undefined' || !('geolocation' in navigator)) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const L = (window as any).L
          map.setView([latitude, longitude], 16)
          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:22px;height:22px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 0 6px rgba(14,165,233,.25)"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          })
          userMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(map)
          setNotice('Unaonekana kwenye ramani')
          setTimeout(() => setNotice(null), 3000)
        },
        () => {
          setNotice('Hatuwezi kupata eneo lako')
          setTimeout(() => setNotice(null), 3000)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }

    const layerButton = (key: LayerKey, label: string, icon: ReactNode, active: boolean) => (
      <button
        type="button"
        onClick={() => setLayer(key)}
        className={`flex items-center gap-1 px-2.5 py-2 text-xs font-semibold transition-colors ${
          active ? 'bg-teal-500 text-white' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
        }`}
        aria-pressed={active}
      >
        {icon} {label}
      </button>
    )

    return (
      <div className={fill ? 'relative h-full' : 'relative'}>
        <div ref={containerRef} className={fill ? 'relative h-full' : 'relative'}>
          <div
            ref={mapRef}
            style={{
              background: 'linear-gradient(180deg, #b8dff0 0%, #d8eef7 100%)',
            }}
            className={
              fill
                ? 'w-full h-full overflow-hidden z-0'
                : 'w-full h-[380px] sm:h-[460px] lg:h-[520px] rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 z-0'
            }
          />

          {/* Layer toggle + fullscreen + locate controls */}
          <div className="absolute top-2 right-2 z-[500] flex flex-col gap-1.5 items-end">
            <div className="flex rounded-xl overflow-hidden bg-white dark:bg-ink-800 shadow-card border border-ink-200 dark:border-ink-700">
              {layerButton('streets', 'Ramani', <Layers className="w-3.5 h-3.5" />, layer === 'streets')}
              {layerButton('satellite', 'Anga', <Satellite className="w-3.5 h-3.5" />, layer === 'satellite')}
            </div>

            <div className="flex rounded-xl overflow-hidden bg-white dark:bg-ink-800 shadow-card border border-ink-200 dark:border-ink-700">
              <button
                type="button"
                onClick={resetView}
                title="Onyesha Zanzibar yote"
                className="p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
              >
                <Home className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={locateMe}
                title="Onyesha eneo langu"
                className="p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Ondoka kamili' : 'Skrini kamili'}
                className="p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Loading indicator until real tiles arrive — never a blank screen */}
          {!tilesReady && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[500]">
              <p className="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-ink-100 bg-white/95 dark:bg-ink-800/95 backdrop-blur-sm border border-ink-200 dark:border-ink-700 rounded-full px-3.5 py-1.5 shadow-card">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                Inapakia ramani ya Zanzibar...
              </p>
            </div>
          )}

          {/* Locate feedback */}
          {notice && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[600] max-w-[90%]">
              <p className="text-xs text-white bg-teal-600 dark:bg-teal-700 rounded-full px-4 py-1.5 shadow-card text-center">
                {notice}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }
)

export default LeafletMarketplaceMap

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

