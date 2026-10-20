'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Heart, MessageCircle, Share2, ShoppingBag, MoreHorizontal, Loader2, Play, Pause, Volume2, VolumeX, CheckCircle } from 'lucide-react'
import { cn } from '@/utils'
import { t, type Language } from '@/i18n/translations'
import { formatTZS } from '@/utils'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@/hooks/useUser'
import toast from 'react-hot-toast'

interface Reel {
  id: string
  product_id: string
  product_name: string
  product_slug: string
  product_price: number
  product_image: string | null
  seller_id: string
  seller_name: string
  seller_slug: string
  seller_logo: string | null
  video_url: string
  thumbnail_url: string | null
  duration_seconds: number
  caption: string | null
  hashtags: string[]
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  created_at: string
  is_liked: boolean
  is_own: boolean
}

interface ReelsFeedProps {
  initialReels?: Reel[]
  hashtag?: string
  sellerId?: string
  lang: Language
}

export default function ReelsFeed({ initialReels = [], hashtag, sellerId, lang }: ReelsFeedProps) {
  const { profile, loading: userLoading } = useUser()
  const [reels, setReels] = useState<Reel[]>(initialReels)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [commentInput, setCommentInput] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        limit: '20',
        ...(nextCursor && { cursor: nextCursor }),
        ...(hashtag && { hashtag }),
        ...(sellerId && { sellerId })
      })

      const response = await fetch(`/api/reels?${params}`)
      const data = await response.json()

      if (data.reels?.length) {
        setReels(prev => [...prev, ...data.reels])
        setNextCursor(data.nextCursor)
        setHasMore(!!data.nextCursor)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Load more reels error:', error)
      toast.error(t('loadMoreFailed', lang))
    } finally {
      setLoadingMore(false)
      setLoading(false)
    }
  }, [loadingMore, hasMore, nextCursor, hashtag, sellerId, lang])

  // Initial load if no initial reels
  useEffect(() => {
    if (!initialReels.length && !loading) {
      setLoading(true)
      loadMore()
    }
  }, [])

  // Set up intersection observer for auto-play
  useEffect(() => {
    const currentReel = reels[currentIndex]
    if (!currentReel) return

    const video = videoRefs.current[currentReel.id]
    if (video) {
      video.play().catch(() => {})
    }

    // Pause other videos
    Object.entries(videoRefs.current).forEach(([id, vid]) => {
      if (id !== currentReel.id) {
        vid.pause()
      }
    })

    // Track view
    if (currentReel) {
      fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view', videoId: currentReel.id, watchDuration: 0 })
      }).catch(() => {})
    }
  }, [currentIndex, reels])

  // Intersection observer for scroll snap
  useEffect(() => {
    const reelElements = document.querySelectorAll('[data-reel-index]')
    if (!reelElements.length) return

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const index = parseInt(entry.target.getAttribute('data-reel-index') || '0')
          setCurrentIndex(index)
        }
      })
    }, { threshold: [0.5, 0.8] })

    reelElements.forEach(el => observerRef.current?.observe(el))

    return () => {
      reelElements.forEach(el => observerRef.current?.unobserve(el))
    }
  }, [reels.length])

  const handleLike = async (reelId: string) => {
    const reel = reels.find(r => r.id === reelId)
    if (!reel) return

    // Optimistic update
    setReels(prev => prev.map(r =>
      r.id === reelId
        ? { ...r, is_liked: !r.is_liked, like_count: r.is_liked ? r.like_count - 1 : r.like_count + 1 }
        : r
    ))

    try {
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', videoId: reelId })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
    } catch (error) {
      // Revert on error
      setReels(prev => prev.map(r =>
        r.id === reelId
          ? { ...r, is_liked: reel.is_liked, like_count: reel.like_count }
          : r
      ))
      console.error('Like error:', error)
    }
  }

  const handleShare = async (reel: Reel) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.product_name,
          text: reel.caption || '',
          url: `${window.location.origin}/products/${reel.product_slug}`
        })
        // Track share
        await fetch('/api/reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'share', videoId: reel.id })
        }).catch(() => {})
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await copyToClipboard(reel)
        }
      }
    } else {
      await copyToClipboard(reel)
    }
  }

  const copyToClipboard = async (reel: Reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${reel.product_slug}`)
      toast.success(t('linkCopied', lang))
    } catch {
      toast.error(t('copyFailed', lang))
    }
  }

  const toggleComments = (reelId: string) => {
    if (showComments === reelId) {
      setShowComments(null)
    } else {
      setShowComments(reelId)
      loadComments(reelId)
    }
  }

  const loadComments = async (reelId: string) => {
    if (comments[reelId]?.length) return

    try {
      const response = await fetch(`/api/reels/comments?videoId=${reelId}&limit=20`)
      const data = await response.json()
      if (data.comments) {
        setComments(prev => ({ ...prev, [reelId]: data.comments }))
      }
    } catch (error) {
      console.error('Load comments error:', error)
    }
  }

  const handleCommentSubmit = async (reelId: string) => {
    if (!commentInput.trim()) return

    const input = commentInput
    setCommentInput('')

    try {
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', videoId: reelId, body: input })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setComments(prev => ({
        ...prev,
        [reelId]: [...(prev[reelId] || []), data]
      }))
    } catch (error) {
      console.error('Comment error:', error)
      toast.error(t('commentFailed', lang))
    }
  }

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
    return count.toString()
  }

  if (reels.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10 text-brand-500" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">{t('noReelsYet', lang)}</h3>
        <p className="text-muted-foreground text-center max-w-xs mb-6">
          {t('noReelsDescription', lang)}
        </p>
        {profile?.role === 'seller' && (
          <Link href="/seller/products" className="btn-primary">
            {t('createFirstReel', lang)}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="h-full overflow-y-scroll snap-y snap-mandatory" onScroll={(e) => {
        // Optional: track scroll for analytics
      }}>
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            data-reel-index={index}
            className="h-screen snap-start snap-always-center relative flex flex-col"
          >
            <div className="relative flex-1 w-full bg-black">
              <video
                ref={(el) => { videoRefs.current[reel.id] = el! }}
                src={reel.video_url}
                playsInline
                loop
                muted
                preload="metadata"
                poster={reel.thumbnail_url || undefined}
                className="w-full h-full object-cover"
              />
              {!reel.thumbnail_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Play className="w-16 h-16 text-white/80" />
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/sellers/${reel.seller_slug}`} className="flex items-center gap-2">
                      <img
                        src={reel.seller_logo || '/placeholder-avatar.png'}
                        alt={reel.seller_name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                      <span className="font-semibold text-white truncate">{reel.seller_name}</span>
                      {reel.is_own && (
                        <CheckCircle className="w-4 h-4 text-brand-400" title={t('yourReel', lang)} />
                      )}
                    </Link>
                    {reel.caption && (
                      <p className="text-white text-sm line-clamp-2 ml-10">{reel.caption}</p>
                    )}
                  </div>

                  {reel.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-10 mb-2">
                      {reel.hashtags.slice(0, 5).map(tag => (
                        <Link
                          key={tag}
                          href={`/search?hashtag=${tag}`}
                          className="text-white/80 text-xs hover:text-brand-300 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1 ml-10 text-white/70 text-xs">
                    <span>{formatCount(reel.view_count)} {t('views', lang)}</span>
                    <span>•</span>
                    <span>{new Date(reel.created_at).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                  <button
                    onClick={() => handleLike(reel.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-full transition-colors',
                      reel.is_liked ? 'text-red-400' : 'text-white/80 hover:text-red-400'
                    )}
                    aria-label={reel.is_liked ? t('unlike', lang) : t('like', lang)}
                  >
                    <Heart className={cn('w-7 h-7', reel.is_liked ? 'fill-current' : '')} />
                    <span className="text-xs font-medium">{formatCount(reel.like_count)}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(reel.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-full text-white/80 hover:text-brand-300 transition-colors"
                    aria-label={t('comments', lang)}
                  >
                    <MessageCircle className="w-7 h-7" />
                    <span className="text-xs font-medium">{formatCount(reel.comment_count)}</span>
                  </button>

                  <button
                    onClick={() => handleShare(reel)}
                    className="flex flex-col items-center gap-1 p-2 rounded-full text-white/80 hover:text-brand-300 transition-colors"
                    aria-label={t('share', lang)}
                  >
                    <Share2 className="w-7 h-7" />
                    <span className="text-xs font-medium">{formatCount(reel.share_count)}</span>
                  </button>

                  <Link
                    href={`/products/${reel.product_slug}`}
                    className="flex flex-col items-center gap-1 p-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                  >
                    <ShoppingBag className="w-7 h-7" />
                    <span className="text-xs font-medium">{t('shopNow', lang)}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Comments Sheet */}
            {showComments === reel.id && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowComments(null)}>
                <div className="absolute bottom-0 left-0 right-0 h-[70vh] max-h-[85vh] bg-white dark:bg-ink-950 rounded-t-2xl flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{t('comments', lang)}</h3>
                    <button onClick={() => setShowComments(null)} className="p-2 rounded-full hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {comments[reel.id]?.length ? (
                      comments[reel.id].map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <img
                            src={comment.user_avatar || '/placeholder-avatar.png'}
                            alt={comment.user_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{comment.user_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mt-1">{comment.body}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">{t('noCommentsYet', lang)}</p>
                    )}
                  </div>

                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <img
                        src={profile?.avatar_url || '/placeholder-avatar.png'}
                        alt={profile?.full_name || 'You'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(reel.id)}
                        placeholder={t('writeComment', lang)}
                        className="input flex-1"
                        maxLength={1000}
                      />
                      <button
                        onClick={() => handleCommentSubmit(reel.id)}
                        disabled={!commentInput.trim()}
                        className="btn-primary px-4"
                      >
                        {t('post', lang)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {loadingMore && (
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {!hasMore && reels.length > 0 && (
          <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
            {t('endOfReels', lang)}
          </div>
        )}
      </div>

      {loading && reels.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      )}
    </div>
  )
}

