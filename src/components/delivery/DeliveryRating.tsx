'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Bike } from 'lucide-react'
import toast from 'react-hot-toast'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface DeliveryRatingProps {
  deliveryId: string
  riderId: string
  reviewerId: string
  reviewerRole: 'buyer' | 'seller'
  riderName?: string
  /** If the reviewer already rated this delivery, pass their existing review to show it read-only. */
  existingRating?: { rating: number; comment: string | null } | null
  onSubmitted?: () => void
}

/**
 * Shown to buyers and sellers once a delivery's status hits 'delivered'.
 * Inserts directly into rider_reviews — RLS (Phase 8) already restricts
 * this to the actual buyer/seller of a delivered delivery, one review per
 * person per delivery (unique constraint), and the recalc_rider_rating
 * trigger (also Phase 8) handles updating rider_profiles.rating_average
 * and auto-suspension automatically — no extra logic needed here.
 */
export default function DeliveryRating({
  deliveryId,
  riderId,
  reviewerId,
  reviewerRole,
  riderName = 'Dereva',
  existingRating,
  onSubmitted,
}: DeliveryRatingProps) {
  const supabase = useMemo(() => createClient(), [])
  const [rating, setRating] = useState(existingRating?.rating ?? 0)
  const [comment, setComment] = useState(existingRating?.comment ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(Boolean(existingRating))

  async function handleSubmit() {
    if (rating < 1) {
      toast.error('Chagua nyota angalau moja')
      return
    }
    setSubmitting(true)

    const { error } = await supabase.from('rider_reviews').insert({
      delivery_id: deliveryId,
      rider_id: riderId,
      reviewer_id: reviewerId,
      reviewer_role: reviewerRole,
      rating,
      comment: comment.trim() || null,
    })

    setSubmitting(false)

    if (error) {
      // Unique constraint violation means they already reviewed this delivery.
      if (error.code === '23505') {
        setSubmitted(true)
        toast.error('Umeshatoa tathmini kwa safari hii')
      } else {
        toast.error('Imeshindikana kutuma tathmini')
      }
      return
    }

    setSubmitted(true)
    toast.success('Asante kwa tathmini yako!')
    onSubmitted?.()
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Asante kwa tathmini yako</p>
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating value={rating} readonly size="sm" />
            <span className="text-xs text-emerald-700">({rating}/5)</span>
          </div>
          {comment && <p className="text-xs text-emerald-700 mt-1.5 italic">&quot;{comment}&quot;</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Bike className="w-4.5 h-4.5 text-brand-500" />
        </div>
        <div>
          <p className="font-semibold text-sm text-ink-900">Mpe tathmini {riderName}</p>
          <p className="text-xs text-ink-500">Safari yako imekamilika — tuambie ilikuwaje</p>
        </div>
      </div>

      <div className="mb-3">
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Maoni yako (hiari)..."
        className="input w-full text-sm resize-none"
        rows={2}
        maxLength={500}
      />

      <Button onClick={handleSubmit} loading={submitting} fullWidth className="mt-3">
        Tuma Tathmini
      </Button>
    </div>
  )
}

