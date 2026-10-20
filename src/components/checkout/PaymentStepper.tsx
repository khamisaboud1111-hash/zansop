'use client'

import { CheckCircle, CreditCard, Package, Truck, Check } from 'lucide-react'
import { cn } from '@/utils'
import type { Language } from '@/i18n/translations'
import { useLangStore } from '@/store'

interface PaymentStepperProps {
  currentStep: 'payment' | 'processing' | 'confirmed' | 'delivery'
  lang?: Language
}

const steps: Array<{ id: string; icon: React.ElementType; swLabel: string; enLabel: string; swDesc: string; enDesc: string }> = [
  { id: 'payment', icon: CreditCard, swLabel: 'Lipa', enLabel: 'Pay', swDesc: 'Chagua njia ya malipo', enDesc: 'Choose payment method' },
  { id: 'processing', icon: Package, swLabel: 'Subiri', enLabel: 'Wait', swDesc: 'Tunasubiri uthibitisho', enDesc: 'Waiting for confirmation' },
  { id: 'confirmed', icon: CheckCircle, swLabel: 'Hakikisha', enLabel: 'Confirm', swDesc: 'Malipo yamehakikishwa', enDesc: 'Payment confirmed' },
  { id: 'delivery', icon: Truck, swLabel: 'Utoaji', enLabel: 'Delivery', swDesc: 'Agizo linasafirishwa', enDesc: 'Order is being delivered' },
]

export function PaymentStepper({ currentStep, lang }: PaymentStepperProps) {
  const storeLang = useLangStore((s) => s.lang)
  const displayLang = lang || storeLang

  const getStepIndex = (stepId: string) => steps.findIndex(s => s.id === stepId)
  const currentIndex = getStepIndex(currentStep)

  return (
    <div className="w-full">
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-ink-200 dark:bg-ink-700" />
        
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex items-start gap-3">
            <div
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10',
                index <= currentIndex
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-400'
              )}>
              {index < currentIndex ? (
                <Check className="w-6 h-6" />
              ) : index === currentIndex ? (
                <step.icon className="w-6 h-6 animate-pulse" />
              ) : (
                <step.icon className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className={cn(
                'font-semibold text-sm transition-colors',
                index <= currentIndex ? 'text-ink-900 dark:text-white' : 'text-ink-500 dark:text-ink-400'
              )}>
                {displayLang === 'sw' ? step.swLabel : step.enLabel}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 truncate">
                {displayLang === 'sw' ? step.swDesc : step.enDesc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact horizontal version for checkout page
export function PaymentStepperCompact({ currentStep, lang }: PaymentStepperProps) {
  const storeLang = useLangStore((s) => s.lang)
  const displayLang = lang || storeLang

  const getStepIndex = (stepId: string) => steps.findIndex(s => s.id === stepId)
  const currentIndex = getStepIndex(currentStep)

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center gap-1 flex-1 relative">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
            index <= currentIndex 
              ? 'bg-brand-500 border-brand-500 text-white' 
              : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-400'
          )}>
            {index < currentIndex ? (
              <Check className="w-4 h-4" />
            ) : index === currentIndex ? (
              <step.icon className="w-4 h-4 animate-pulse" />
            ) : (
              <step.icon className="w-4 h-4" />
            )}
          </div>
          <span className={cn(
            'text-[10px] font-medium text-center transition-colors max-w-[60px]',
            index <= currentIndex ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 dark:text-ink-500'
          )}>
            {displayLang === 'sw' ? step.swLabel : step.enLabel}
          </span>
          
          {/* Connecting line between steps */}
          {index < steps.length - 1 && (
            <div className={cn(
              'absolute top-4 left-1/2 right-1/2 h-0.5 -z-10',
              index < currentIndex 
                ? 'bg-brand-500' 
                : 'bg-ink-200 dark:bg-ink-700'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

