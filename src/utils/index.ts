import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DeliveryZone, OrderStatus } from '@/types'
import type { Language } from '@/i18n/translations'
import { getDefaultDeliveryZones } from '@/lib/deliveryZones'

// Re-export DELIVERY_ZONES for backward compatibility (as an object keyed by zone)
export const DELIVERY_ZONES = Object.fromEntries(
  getDefaultDeliveryZones().map(z => [z.zone, {
    nameEn: z.name_en,
    nameSw: z.name_sw,
    fee: z.fee,
    estimated_days: z.estimated_days,
  }])
)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTZS(amount: number, lang: Language = 'sw'): string {
  const locale = lang === 'sw' ? 'sw-TZ' : lang === 'ar' ? 'ar-TZ' : lang === 'fr' ? 'fr-TZ' : 'en-TZ'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string, lang: Language = 'en'): string {
  const locale = lang === 'sw' ? 'sw-TZ' : lang === 'ar' ? 'ar-TZ' : lang === 'fr' ? 'fr-TZ' : 'en-TZ'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateSKU(storeName: string, productName: string): string {
  const storeCode = storeName.slice(0, 3).toUpperCase()
  const productCode = productName.slice(0, 4).toUpperCase().replace(/\s/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${storeCode}-${productCode}-${random}`
}

// The steps an order actually goes through. This has to match the
// order_status enum: 'assigned' and 'picked_up' are not statuses an order
// can be in, and cancelled/refunded are terminal states the tracker shows
// on their own. A step that is not in the list has no icon in the tracker,
// and reading it took the whole order page down.
export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered'
]

export function getOrderStatusIndex(status: OrderStatus): number {
  return ORDER_STATUS_STEPS.indexOf(status)
}

export const PAYMENT_METHODS = [
  { id: 'mpesa',       label: 'M-Pesa',       icon: '📱', swLabel: 'M-Pesa' },
  { id: 'tigopesa',    label: 'Tigo Pesa',    icon: '📱', swLabel: 'Tigo Pesa' },
  { id: 'airtelmoney', label: 'Airtel Money', icon: '📱', swLabel: 'Airtel Money' },
  { id: 'halopesa',    label: 'Halopesa',     icon: '📱', swLabel: 'Halopesa' },
  { id: 'cod',         label: 'Cash on Delivery', icon: '💵', swLabel: 'Malipo Mkononi' },
]

// Maps the checkout UI's payment_method id to the payment_transactions.provider enum
export function toPaymentProvider(methodId: string): 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'cash_on_delivery' | 'manual' {
  switch (methodId) {
    case 'mpesa': return 'mpesa'
    case 'tigopesa': return 'tigo_pesa'
    case 'airtelmoney': return 'airtel_money'
    case 'cod': return 'cash_on_delivery'
    default: return 'manual' // e.g. halopesa, not yet supported by an adapter
  }
}

export function whatsappUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleaned}?text=${encoded}`
}

// Swahili-first WhatsApp message templates
export const whatsappTemplates = {
  productInquiry: (productName: string, price: number, lang: Language = 'sw') => {
    const formattedPrice = lang === 'sw' ? `TZS ${price.toLocaleString('sw-TZ')}` : `TZS ${price.toLocaleString()}`
    return lang === 'sw'
      ? `Habari! Ninahitaji ${productName} bei ${formattedPrice}. Je, ipo?`
      : `Hello! I'm interested in ${productName} for ${formattedPrice}. Is it available?`
  },
  orderConfirmation: (orderId: string, total: number, lang: Language = 'sw') => {
    const formattedTotal = lang === 'sw' ? `TZS ${total.toLocaleString('sw-TZ')}` : `TZS ${total.toLocaleString()}`
    return lang === 'sw'
      ? `Asante kwa agizo lako #${orderId.slice(-8).toUpperCase()} (${formattedTotal}). Tutakupigia simu kuthibitisha.`
      : `Thanks for your order #${orderId.slice(-8).toUpperCase()} (${formattedTotal}). We'll call to confirm.`
  },
  deliveryTracking: (orderId: string, trackingUrl: string, lang: Language = 'sw') => {
    return lang === 'sw'
      ? `Fuatilia agizo lako #${orderId.slice(-8).toUpperCase()}: ${trackingUrl}`
      : `Track your order #${orderId.slice(-8).toUpperCase()}: ${trackingUrl}`
  },
}

export function getPublicImageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

