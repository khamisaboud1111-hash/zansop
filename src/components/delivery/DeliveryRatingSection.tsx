'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DeliveryRating from './DeliveryRating'

interface DeliveryRatingSectionProps {
  orderId: string
  reviewerId: string
  reviewerRole: 'buyer' | 'seller'
}

interface DeliveryInfo {
  id: string
  rider_id: string
  status: string
}

/**
 * Drop this into the buyer's order page or the seller's orders list. It looks
 * up whether this order has a delivered Zanshop delivery, whether the
 * current viewer already reviewed it, and renders the rating form (or the
 * already-submitted state) accordingly. Renders nothing if there's no
 * delivered delivery for this order yet (e.g. cash pickup, or still in transit).
 */
export default function DeliveryRatingSection({ orderId, reviewerId, reviewerRole }: DeliveryRatingSectionProps) {
  const supabase = useMemo(() => createClient(), [])
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null)
  const [riderName, setRiderName] = useState('Dereva')
  const [existingRating, setExistingRating] = useState<{ rating: number; comment: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  async function load() {
    setLoading(true)

    const { data: deliveryRow } = await supabase
      .from('deliveries')
      .select('id, rider_id, status')
      .eq('order_id', orderId)
      .eq('status', 'delivered')
      .maybeSingle()

    if (!deliveryRow) {
      setLoading(false)
      return
    }

    setDelivery(deliveryRow)

    const [{ data: riderAccount }, { data: review }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', deliveryRow.rider_id).single(),
      supabase
        .from('rider_reviews')
        .select('rating, comment')
        .eq('delivery_id', deliveryRow.id)
        .eq('reviewer_id', reviewerId)
        .maybeSingle(),
    ])

    if (riderAccount?.full_name) setRiderName(riderAccount.full_name)
    if (review) setExistingRating(review)

    setLoading(false)
  }

  if (loading || !delivery) return null

  return (
    <DeliveryRating
      deliveryId={delivery.id}
      riderId={delivery.rider_id}
      reviewerId={reviewerId}
      reviewerRole={reviewerRole}
      riderName={riderName}
      existingRating={existingRating}
    />
  )
}


