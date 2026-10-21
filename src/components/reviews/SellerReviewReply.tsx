'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { replyToSellerReview, type SellerReview } from '@/hooks/useSellerReviews'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

/**
 * The seller's answer to a review. The database pins the rating and the
 * customer's words, so a reply can only add the seller's own text.
 */
export default function SellerReviewReply({
  review,
  onReplied,
}: {
  review: SellerReview
  onReplied?: () => void
}) {
  const lang = useLangStore((s) => s.lang)
  const [reply, setReply] = useState(review.seller_reply ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await replyToSellerReview(review.id, reply)
    setSaving(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(t('replySaved', lang))
    onReplied?.()
  }

  return (
    <div className="mt-3">
      <label className="label">{t('sellerReply', lang)}</label>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={2}
        maxLength={1000}
        className="input resize-none"
        placeholder={t('sellerReplyPlaceholder', lang)}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary mt-2 inline-flex items-center gap-2 text-xs"
      >
        <Send className="w-3.5 h-3.5" />
        {saving ? t('submittingLabel', lang) : t('saveReply', lang)}
      </button>
    </div>
  )
}
