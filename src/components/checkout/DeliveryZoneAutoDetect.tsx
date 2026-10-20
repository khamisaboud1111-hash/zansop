'use client'

import { MapPin, Loader2, Navigation } from 'lucide-react'
import { useAutoDetectZone } from '@/hooks/useAutoDetectZone'
import { useLangStore } from '@/store'
import { getDefaultDeliveryZones } from '@/lib/deliveryZones'
import type { DeliveryZone } from '@/types'

interface Props {
  onDetected: (zone: DeliveryZone) => void
  currentZone?: string
}

export function DeliveryZoneAutoDetect({ onDetected, currentZone }: Props) {
  const { lang } = useLangStore()
  const { detecting, error, detect } = useAutoDetectZone()

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => detect(onDetected)}
        disabled={detecting}
        className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors disabled:opacity-60 min-h-[44px]"
      >
        {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        {lang === 'sw' ? 'Tambua eneo langu' : 'Detect my zone'}
      </button>
      {currentZone && getDefaultDeliveryZones().find(z => z.zone === currentZone) && (
        <p className="text-xs text-ink-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {lang === 'sw' ? getDefaultDeliveryZones().find(z => z.zone === currentZone)?.name_sw : getDefaultDeliveryZones().find(z => z.zone === currentZone)?.name_en}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

