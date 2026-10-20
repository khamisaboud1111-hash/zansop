'use client'

import { Check, Package, PackageCheck, Truck, Home, XCircle } from 'lucide-react'
import { cn, ORDER_STATUS_STEPS, getOrderStatusIndex } from '@/utils'
import { useLangStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'
import type { OrderStatus, OrderTracking } from '@/types'
import { formatDate } from '@/utils'

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; labelKey: TranslationKey }> = {
  pending:          { icon: <Package className="w-4 h-4" />,      labelKey: 'pending' },
  confirmed:        { icon: <Check className="w-4 h-4" />,         labelKey: 'confirmed' },
  packed:           { icon: <PackageCheck className="w-4 h-4" />, labelKey: 'packed' },
  out_for_delivery: { icon: <Truck className="w-4 h-4" />,         labelKey: 'outForDelivery' },
  delivered:        { icon: <Home className="w-4 h-4" />,          labelKey: 'delivered' },
}

interface OrderTrackerProps {
  currentStatus: OrderStatus
  tracking?: OrderTracking[]
}

export default function OrderTracker({ currentStatus, tracking = [] }: OrderTrackerProps) {
  const { lang } = useLangStore()

  if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700 text-sm">{t('cancelled', lang)}</p>
          {tracking[tracking.length - 1]?.note && (
            <p className="text-xs text-red-500 mt-0.5">{tracking[tracking.length - 1].note}</p>
          )}
        </div>
      </div>
    )
  }

  const currentIndex = getOrderStatusIndex(currentStatus)

  return (
    <div className="space-y-1">
      {/* Step indicator */}
      <div className="flex items-center">
        {ORDER_STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex
          const isCurrent   = idx === currentIndex
          const config = STATUS_CONFIG[step]

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Circle */}
              <div className={cn(
                'relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                isCompleted
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white border-ink-200 text-ink-400',
                isCurrent && 'ring-2 ring-brand-200'
              )}>
                {config.icon}
                {isCurrent && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-spice-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Line */}
              {idx < ORDER_STATUS_STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-1',
                  idx < currentIndex ? 'bg-brand-500' : 'bg-ink-200'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {ORDER_STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIndex
          const config = STATUS_CONFIG[step]
          return (
            <div key={step} className={cn(
              'text-center',
              idx === 0 ? 'text-left' : idx === ORDER_STATUS_STEPS.length - 1 ? 'text-right' : 'text-center',
              'flex-1'
            )}>
              <p className={cn(
                'text-xs font-medium leading-tight',
                isCompleted ? 'text-brand-700' : 'text-ink-400'
              )}>
                {t(config.labelKey, lang)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Tracking timeline */}
      {tracking.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ink-100 space-y-3">
          {[...tracking].reverse().map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ink-700">
                  {STATUS_CONFIG[event.status] ? t(STATUS_CONFIG[event.status].labelKey, lang) : event.status}
                </p>
                {event.note && <p className="text-xs text-ink-500">{event.note}</p>}
                <p className="text-xs text-ink-400 mt-0.5">{formatDate(event.created_at, lang)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

