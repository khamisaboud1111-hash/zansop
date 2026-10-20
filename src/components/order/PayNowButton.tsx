'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PayNowButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const json = await res.json()
      if (res.ok && json.payment_link) {
        window.location.href = json.payment_link
        return
      }
      toast.error(json.error ?? 'Imeshindikana kuanzisha malipo')
    } catch {
      toast.error('Hitilafu ya mtandao')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
      Lipa Sasa
    </button>
  )
}

