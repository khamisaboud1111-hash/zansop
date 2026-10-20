import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import { t } from '@/i18n/translations'
import { useLangStore } from '@/store'

export function useWishlist(productId: string) {
  const supabase = useMemo(() => createClient(), [])
  const { lang } = useLangStore()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkWishlistStatus = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsWishlisted(false)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

      setIsWishlisted(!!data)
    } catch (error: any) {
      // Ignore errors when no wishlist item is found (PGRST116)
      if (error.code !== 'PGRST116') {
        console.error('Error checking wishlist status:', error)
      }
      setIsWishlisted(false)
    } finally {
      setLoading(false)
    }
  }, [productId, supabase])

  const toggleWishlist = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error(t('loginFirst', lang))
        setLoading(false)
        return
      }

      if (isWishlisted) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)
        setIsWishlisted(false)
      } else {
        await supabase
          .from('wishlists')
          .insert({ user_id: user.id, product_id: productId })
        setIsWishlisted(true)
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      toast.error('Failed to update wishlist')
    } finally {
      setLoading(false)
    }
  }, [isWishlisted, productId, supabase, lang])

  // Check initial wishlist status on mount
  useEffect(() => {
    checkWishlistStatus()
  }, [checkWishlistStatus])

  return {
    isWishlisted,
    toggleWishlist,
    loading,
    refetch: checkWishlistStatus
  }
}

