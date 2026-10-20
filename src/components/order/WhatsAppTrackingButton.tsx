'use client'

import { MessageCircle, Share2 } from 'lucide-react'
import { useLangStore } from '@/store'
import { whatsappUrl, whatsappTemplates } from '@/utils'

interface Props {
  orderId: string
  phone?: string | null
  sellerPhone?: string | null
  total?: number
  variant?: 'customer' | 'seller'
  className?: string
}

export function WhatsAppTrackingButton({ orderId, phone, sellerPhone, total, variant = 'customer', className }: Props) {
  const { lang } = useLangStore()
  const targetPhone = variant === 'seller' ? sellerPhone : phone

  if (!targetPhone) return null

  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/orders/${orderId}` : `/orders/${orderId}`
  const message =
    variant === 'seller'
      ? whatsappTemplates.deliveryTracking(orderId, trackingUrl, lang)
      : whatsappTemplates.orderConfirmation(orderId, total ?? 0, lang)

  const href = whatsappUrl(targetPhone, message)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors min-h-[48px] shadow-sm'
      }
    >
      <MessageCircle className="w-4 h-4" />
      {lang === 'sw'
        ? variant === 'seller'
          ? 'Tuma taarifa kwa WhatsApp'
          : 'Fuatilia kwa WhatsApp'
        : variant === 'seller'
          ? 'Share via WhatsApp'
          : 'Track via WhatsApp'}
      <Share2 className="w-3.5 h-3.5 opacity-70" />
    </a>
  )
}

