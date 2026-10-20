'use client'

import { useState } from 'react'
import { StarRating } from '@/components/ui/StarRating'
import { submitReview } from '@/hooks/useReviews'
import toast from 'react-hot-toast'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface ReviewFormProps {
  productId: string
  orderId: string
  productName: string
  onSubmitted?: () => void
}

export default function ReviewForm({ productId, orderId, productName, onSubmitted }: ReviewFormProps) {
  const lang = useLangStore((s) => s.lang)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast.error(t('selectRating', lang)); return }
    setSubmitting(true)
    const { error } = await submitReview({ productId, orderId, rating, comment: comment.trim() || undefined })
    if (error) toast.error(error)
    else {
      toast.success(t('thanksForReview', lang))
      onSubmitted?.()
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <p className="font-semibold text-sm text-ink-800">{productName}</p>
      <div>
        <label className="label">{t('rating', lang)}</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label className="label">{t('reviewOptional', lang)}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="input resize-none"
          placeholder={t('reviewPlaceholder', lang)}
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? t('submittingLabel', lang) : t('submitReview', lang)}
      </button>
    </form>
  )
}

