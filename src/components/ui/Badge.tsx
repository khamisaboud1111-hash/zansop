'use client'

import { Check } from 'lucide-react'
import { cn } from '@/utils'
import { useLangStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'

type BadgeVariant = 'green' | 'orange' | 'blue' | 'red' | 'gray' | 'gold'

const variants: Record<BadgeVariant, string> = {
  green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  orange: 'bg-spice-100 text-spice-700 dark:bg-spice-500/15 dark:text-spice-300',
  blue:   'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  gray:   'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  gold:   'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  const lang = useLangStore((s) => s.lang)
  const map: Record<string, BadgeVariant> = {
    pending: 'gray', confirmed: 'blue', packed: 'blue',
    out_for_delivery: 'orange', delivered: 'green',
    cancelled: 'red', refunded: 'red',
  }
  const labelKey: Record<string, TranslationKey> = {
    pending: 'pending', confirmed: 'confirmed', packed: 'packed',
    out_for_delivery: 'outForDelivery', delivered: 'delivered',
    cancelled: 'cancelled', refunded: 'refunded',
  }
  const key = labelKey[status]
  return <Badge variant={map[status] ?? 'gray'}>{key ? t(key, lang) : status}</Badge>
}

export function VerifiedSellerBadge({ verified, className }: { verified: boolean; className?: string }) {
  const lang = useLangStore((s) => s.lang)
  if (!verified) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      'bg-brand-500/15 text-brand-600 dark:text-brand-300 ring-1 ring-brand-500/30',
      className
    )}>
      <Check className="w-3 h-3" /> {t('verifiedSellerLabel', lang)}
    </span>
  )
}

export function SellerStatusBadge({ status }: { status: string }) {
  const lang = useLangStore((s) => s.lang)
  const map: Record<string, BadgeVariant> = { approved: 'green', pending: 'orange', suspended: 'red' }
  const labelKey: Record<string, TranslationKey> = { approved: 'approved', pending: 'pending', suspended: 'suspended' }
  const key = labelKey[status]
  return <Badge variant={map[status] ?? 'gray'}>{key ? t(key, lang) : status}</Badge>
}

export function ProductStatusBadge({ status }: { status: string }) {
  const lang = useLangStore((s) => s.lang)
  const map: Record<string, BadgeVariant> = { active: 'green', draft: 'gray', out_of_stock: 'orange', sold: 'red', rejected: 'red' }
  const labelKey: Record<string, TranslationKey> = {
    active: 'activeStatus', draft: 'draft', out_of_stock: 'outOfStock', sold: 'sold', rejected: 'rejected',
  }
  const key = labelKey[status]
  return <Badge variant={map[status] ?? 'gray'}>{key ? t(key, lang) : status}</Badge>
}

