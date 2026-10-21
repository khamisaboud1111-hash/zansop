'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SellerReview {
  id: string
  order_id: string
  seller_id: string
  buyer_id: string
  rating: number
  comment: string | null
  seller_reply: string | null
  created_at: string
  buyer?: { full_name: string; avatar_url: string | null } | null
}

export interface ProductReview {
  id: string
  product_id: string
  order_id: string
  buyer_id: string
  rating: number
  comment: string | null
  seller_reply: string | null
  created_at: string
  buyer?: { full_name: string; avatar_url: string | null } | null
}

/**
 * Public reviews of one seller, newest first. Anyone can read them - the
 * store page shows them.
 */
export function useSellerReviews(sellerId: string | undefined) {
  const supabase = useMemo(() => createClient(), [])
  const [reviews, setReviews] = useState<SellerReview[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!sellerId) {
      setReviews([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('seller_reviews')
      .select('*, buyer:profiles(full_name, avatar_url)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    setReviews((data ?? []) as SellerReview[])
    setLoading(false)
  }, [sellerId, supabase])

  useEffect(() => { fetch() }, [fetch])

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return { reviews, loading, average, count: reviews.length, refetch: fetch }
}

/**
 * The seller's own reviews, for the page where they answer them.
 */
export function useMySellerReviews() {
  const supabase = useMemo(() => createClient(), [])
  const [reviews, setReviews] = useState<SellerReview[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReviews([])
      setLoading(false)
      return
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!seller) {
      setReviews([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('seller_reviews')
      .select('*, buyer:profiles(full_name, avatar_url)')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })

    setReviews((data ?? []) as SellerReview[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])

  return { reviews, loading, refetch: fetch }
}

/**
 * The review a buyer already left for a seller on one order, if any.
 */
export function useMySellerReview(orderId: string | undefined, sellerId: string | undefined) {
  const supabase = useMemo(() => createClient(), [])
  const [review, setReview] = useState<SellerReview | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!orderId || !sellerId) {
      setReview(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReview(null)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('seller_reviews')
      .select('*')
      .eq('order_id', orderId)
      .eq('seller_id', sellerId)
      .eq('buyer_id', user.id)
      .maybeSingle()
    setReview((data as SellerReview) ?? null)
    setLoading(false)
  }, [orderId, sellerId, supabase])

  useEffect(() => { fetch() }, [fetch])

  return { review, loading, refetch: fetch }
}

export async function submitSellerReview(opts: {
  orderId: string
  sellerId: string
  rating: number
  comment?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('seller_reviews')
    .insert({
      order_id: opts.orderId,
      seller_id: opts.sellerId,
      buyer_id: user.id,
      rating: opts.rating,
      comment: opts.comment?.trim() || null,
    })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}

export async function replyToSellerReview(reviewId: string, reply: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('seller_reviews')
    .update({ seller_reply: reply.trim() || null })
    .eq('id', reviewId)
  return { error: error?.message ?? null }
}

export async function replyToProductReview(reviewId: string, reply: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('reviews')
    .update({ seller_reply: reply.trim() || null })
    .eq('id', reviewId)
  return { error: error?.message ?? null }
}
