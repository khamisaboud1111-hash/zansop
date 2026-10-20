'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

export function useNotifications() {
  const supabase = useMemo(() => createClient(), [])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const fetch = useCallback(async () => {
    if (!mountedRef.current) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        if (mountedRef.current) setLoading(false)
        return 
      }

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      if (mountedRef.current) {
        setNotifications(data ?? [])
        setUnreadCount((data ?? []).filter((n: Notification) => !n.is_read).length)
        setLoading(false)
        setError(null)
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error('useNotifications fetch error:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch notifications'))
        setLoading(false)
      }
    }
  }, [supabase])

  useEffect(() => {
    mountedRef.current = true
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function setup() {
      if (!mountedRef.current) return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { 
          if (mountedRef.current) setLoading(false)
          return 
        }
        if (cancelled || !mountedRef.current) return

        await fetch()

        channel = supabase
          .channel(`notifications-${user.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          }, (payload) => {
            if (!mountedRef.current) return
            const n = payload.new as Notification
            setNotifications((prev) => [n, ...prev])
            setUnreadCount((c) => c + 1)
          })
          .subscribe()
      } catch (err) {
        if (mountedRef.current) {
          console.error('useNotifications setup error:', err)
          setError(err instanceof Error ? err : new Error('Failed to setup notifications'))
          setLoading(false)
        }
      }
    }

    setup()

    return () => {
      mountedRef.current = false
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetch, supabase])

  async function markRead(id: string) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('markRead error:', err)
    }
  }

  async function markAllRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('markAllRead error:', err)
    }
  }

  async function deleteNotification(id: string) {
    try {
      await supabase.from('notifications').delete().eq('id', id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('deleteNotification error:', err)
    }
  }

  return { notifications, unreadCount, loading, error, markRead, markAllRead, deleteNotification, refetch: fetch }
}

