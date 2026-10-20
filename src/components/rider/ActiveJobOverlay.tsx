'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation, Banknote, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ActiveOffer } from '@/hooks/useRiderTracking'

interface ActiveJobOverlayProps {
  offer: ActiveOffer
  onAccept: () => Promise<boolean>
  onDecline: () => Promise<boolean>
}

export default function ActiveJobOverlay({ offer, onAccept, onDecline }: ActiveJobOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(30)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!offer.timeout_expires_at) return
    const target = new Date(offer.timeout_expires_at).getTime()

    const tick = () => {
      const remaining = Math.max(0, Math.round((target - Date.now()) / 1000))
      setSecondsLeft(remaining)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [offer.timeout_expires_at])

  const pct = Math.max(0, Math.min(100, (secondsLeft / 30) * 100))
  const distanceKm = offer.distance_meters ? (offer.distance_meters / 1000).toFixed(1) : null

  async function handle(action: 'accept' | 'decline') {
    setBusy(true)
    if (action === 'accept') await onAccept()
    else await onDecline()
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-modal overflow-hidden">
        {/* Countdown bar */}
        <div className="h-2 bg-ink-100 w-full">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${secondsLeft <= 10 ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" /> Safari Mpya
            </span>
            <span className={`font-display font-black text-2xl ${secondsLeft <= 10 ? 'text-red-500' : 'text-ink-900'}`}>
              {secondsLeft}s
            </span>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-ink-500 font-medium">Mahali pa Kuchukua</p>
                <p className="text-sm font-semibold text-ink-900">{offer.pickup_address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-ink-500 font-medium">Mahali pa Kufikisha</p>
                <p className="text-sm font-semibold text-ink-900">{offer.delivery_address}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-ink-50 rounded-xl p-3 mb-5">
            <div>
              <p className="text-xs text-ink-500">Umbali</p>
              <p className="font-semibold text-ink-900">{distanceKm ? `${distanceKm} km` : '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-500">Mapato</p>
              <p className="font-display font-black text-lg text-brand-600 flex items-center gap-1 justify-end">
                <Banknote className="w-4 h-4" /> TZS {offer.delivery_fee.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth disabled={busy} onClick={() => handle('decline')}>
              Kataa
            </Button>
            <Button variant="primary" fullWidth disabled={busy} onClick={() => handle('accept')}>
              Kubali
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

