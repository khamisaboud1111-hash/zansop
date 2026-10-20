'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useUser() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { 
          if (mountedRef.current) setLoading(false)
          return 
        }
        if (cancelled || !mountedRef.current) return

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        if (mountedRef.current) {
          setProfile(data)
          setError(null)
        }
      } catch (err) {
        if (mountedRef.current) {
          console.error('useUser load error:', err)
          setError(err instanceof Error ? err : new Error('Failed to load user'))
        }
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled && mountedRef.current) load()
    })

    return () => {
      mountedRef.current = false
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  return { 
    profile, 
    loading, 
    error,
    isAdmin: profile?.role === 'admin', 
    isSeller: profile?.role === 'seller' || profile?.role === 'admin' 
  }
}

