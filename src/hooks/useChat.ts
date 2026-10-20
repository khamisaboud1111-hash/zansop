'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  sender_name?: string
  sender_avatar?: string
  body: string
  message_type: 'text' | 'image' | 'product_card' | 'system'
  attachment_url: string | null
  read_at: string | null
  created_at: string
  is_own?: boolean
}

export interface ChatRoom {
  id: string
  participant_type: 'buyer_seller' | 'buyer_rider' | 'seller_rider'
  buyer_id: string | null
  seller_id: string | null
  rider_id: string | null
  product_id: string | null
  product_name?: string
  product_image?: string
  seller_name?: string
  seller_slug?: string
  seller_logo?: string
  rider_name?: string
  rider_avatar?: string
  buyer_name?: string
  buyer_avatar?: string
  last_message_at: string
  unread_count: number
}

export type ParticipantType = 'buyer_seller' | 'buyer_rider' | 'seller_rider'

interface UseChatOptions {
  buyerId?: string
  sellerId?: string
  riderId?: string
  productId?: string | null
  participantType?: ParticipantType
}

/**
 * Extended chat hook supporting:
 * - Buyer ↔ Seller (buyer_seller)
 * - Buyer ↔ Rider (buyer_rider)
 * - Seller ↔ Rider (seller_rider)
 */
export function useChat(options: UseChatOptions) {
  const supabase = useMemo(() => createClient(), [])
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [rooms, setRooms] = useState<ChatRoom[]>([])

  const { buyerId, sellerId, riderId, productId, participantType = 'buyer_seller' } = options

  useEffect(() => {
    if (!buyerId && !sellerId && !riderId) return
    init()
    loadRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId, sellerId, riderId, productId, participantType])

  async function init() {
    if (!hasRequiredParticipants()) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      let roomId: string | null = null

      // Find existing room based on participant type
      let query = supabase.from('chat_rooms').select('*').eq('participant_type', participantType)

      switch (participantType) {
        case 'buyer_seller':
          query = query.eq('buyer_id', buyerId!).eq('seller_id', sellerId!)
          if (productId) query = query.eq('product_id', productId)
          else query = query.is('product_id', null)
          break
        case 'buyer_rider':
          query = query.eq('buyer_id', buyerId!).eq('rider_id', riderId!)
          break
        case 'seller_rider':
          query = query.eq('seller_id', sellerId!).eq('rider_id', riderId!)
          break
      }

      const { data: existing } = await query.maybeSingle()

      if (existing) {
        roomId = existing.id
      } else {
        // Create room using appropriate RPC
        let rpcName = ''
        let rpcParams: Record<string, string | null> = {}

        switch (participantType) {
          case 'buyer_seller':
            rpcName = 'create_buyer_seller_room'
            // null, not '' - p_product_id is a uuid and '' fails the cast.
            rpcParams = { p_buyer_id: buyerId!, p_seller_id: sellerId!, p_product_id: productId ?? null }
            break
          case 'buyer_rider':
            rpcName = 'create_buyer_rider_room'
            rpcParams = { p_buyer_id: buyerId!, p_rider_id: riderId! }
            break
          case 'seller_rider':
            rpcName = 'create_seller_rider_room'
            rpcParams = { p_seller_id: sellerId!, p_rider_id: riderId! }
            break
        }

        const { data: created, error } = await supabase.rpc(rpcName, rpcParams)
        if (error) {
          console.error('[useChat] room creation failed:', error)
          setLoading(false)
          return
        }
        roomId = created
      }

      if (roomId) {
        // Load room details and messages
        const { data: roomData } = await supabase
          .from('chat_rooms')
          .select(`
            *,
            seller:sellers!seller_id(store_name, store_slug, logo_url),
            buyer:profiles!buyer_id(full_name, avatar_url),
            rider:profiles!rider_id(full_name, avatar_url),
            product:products!product_id(name, images:product_images(url, is_primary))
          `)
          .eq('id', roomId)
          .single()

        if (roomData) {
          setRoom(transformRoomData(roomData))
          await loadMessages(roomId)
        }
      }
    } catch (error) {
      console.error('[useChat] init error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadRooms() {
    const userId = buyerId || sellerId ? (buyerId || sellerId) : riderId
    if (!userId) return

    try {
      const { data } = await supabase.rpc('get_chat_rooms', { p_user_id: userId })
      if (data) {
        setRooms(transformRoomsData(data))
      }
    } catch (error) {
      console.error('[useChat] loadRooms error:', error)
    }
  }

  async function loadMessages(roomId: string) {
    try {
      const { data } = await supabase.rpc('get_messages', {
        p_room_id: roomId,
        p_limit: 50
      })
      if (data) {
        setMessages(data.map((m: any) => ({
          ...m,
          is_own: m.sender_id === (buyerId || sellerId || riderId)
        })))
      }
    } catch (error) {
      console.error('[useChat] loadMessages error:', error)
    }
  }

  // Append a message, ignoring one we already have. The sender's own message
  // arrives twice: once from the optimistic insert and once from realtime.
  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
  }, [])

  // Realtime: new messages in this room
  useEffect(() => {
    if (!room?.id) return

    const channel = supabase
      .channel(`chat-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          appendMessage({
            ...newMsg,
            is_own: newMsg.sender_id === (buyerId || sellerId || riderId)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room?.id, supabase, buyerId, sellerId, riderId, appendMessage])

  // Realtime: room updates (last_message_at, unread_count)
  useEffect(() => {
    const userId = buyerId || sellerId || riderId
    if (!userId) return

    const channel = supabase
      .channel('chat-rooms-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_rooms' },
        () => {
          loadRooms()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [supabase, buyerId, sellerId, riderId])

  function hasRequiredParticipants(): boolean {
    switch (participantType) {
      case 'buyer_seller':
        return !!buyerId && !!sellerId
      case 'buyer_rider':
        return !!buyerId && !!riderId
      case 'seller_rider':
        return !!sellerId && !!riderId
      default:
        return false
    }
  }

  function transformRoomData(data: any): ChatRoom {
    return {
      id: data.id,
      participant_type: data.participant_type,
      buyer_id: data.buyer_id,
      seller_id: data.seller_id,
      rider_id: data.rider_id,
      product_id: data.product_id,
      product_name: data.product?.name,
      product_image: data.product?.images?.find((pi: any) => pi.is_primary)?.url,
      seller_name: data.seller?.store_name,
      seller_slug: data.seller?.store_slug,
      seller_logo: data.seller?.logo_url,
      rider_name: data.rider?.full_name,
      rider_avatar: data.rider?.avatar_url,
      buyer_name: data.buyer?.full_name,
      buyer_avatar: data.buyer?.avatar_url,
      last_message_at: data.last_message_at,
      unread_count: 0
    }
  }

  function transformRoomsData(data: any[]): ChatRoom[] {
    return data.map((r) => ({
      id: r.id,
      participant_type: r.participant_type,
      buyer_id: r.buyer_id,
      seller_id: r.seller_id,
      rider_id: r.rider_id,
      product_id: r.product_id,
      product_name: r.product_name,
      product_image: r.product_image,
      seller_name: r.seller_name,
      seller_slug: r.seller_slug,
      seller_logo: r.seller_logo,
      rider_name: r.rider_name,
      rider_avatar: r.rider_avatar,
      buyer_name: r.buyer_name,
      buyer_avatar: r.buyer_avatar,
      last_message_at: r.last_message_at,
      unread_count: r.unread_count || 0
    }))
  }

  const sendMessage = useCallback(
    async (body: string, senderId: string, messageType: ChatMessage['message_type'] = 'text', attachmentUrl?: string) => {
      if (!room || !body.trim()) return false
      setSending(true)
      try {
        const { data, error } = await supabase.rpc('send_message', {
          p_room_id: room.id,
          p_body: body.trim(),
          p_message_type: messageType,
          p_attachment_url: attachmentUrl ?? null
        })
        setSending(false)
        if (error) {
          console.error('[useChat] sendMessage error:', error)
          return false
        }
        // Show the message straight away instead of waiting for the realtime
        // socket, which may be slow or blocked.
        const sent = (Array.isArray(data) ? data[0] : data) as ChatMessage | undefined
        if (sent?.id) {
          appendMessage({
            id: sent.id,
            room_id: sent.room_id ?? room.id,
            sender_id: sent.sender_id ?? senderId,
            body: sent.body ?? body.trim(),
            message_type: sent.message_type ?? messageType,
            attachment_url: sent.attachment_url ?? attachmentUrl ?? null,
            read_at: null,
            created_at: sent.created_at ?? new Date().toISOString(),
            is_own: true,
          })
        }
        return true
      } catch (error) {
        console.error('[useChat] sendMessage error:', error)
        setSending(false)
        return false
      }
    },
    [room, supabase, buyerId, sellerId, riderId, appendMessage]
  )

  const markRead = useCallback(
    async (viewerId: string) => {
      if (!room) return
      try {
        await supabase.rpc('mark_messages_read', { p_room_id: room.id })
      } catch (error) {
        console.error('[useChat] markRead error:', error)
      }
    },
    [room, supabase]
  )

  const createBuyerSellerRoom = useCallback(
    async (buyerId: string, sellerId: string, productId?: string) => {
      const { data, error } = await supabase.rpc('create_buyer_seller_room', {
        p_buyer_id: buyerId,
        p_seller_id: sellerId,
        p_product_id: productId ?? null
      })
      if (error) throw error
      return data
    },
    [supabase]
  )

  const createBuyerRiderRoom = useCallback(
    async (buyerId: string, riderId: string) => {
      const { data, error } = await supabase.rpc('create_buyer_rider_room', {
        p_buyer_id: buyerId,
        p_rider_id: riderId
      })
      if (error) throw error
      return data
    },
    [supabase]
  )

  const createSellerRiderRoom = useCallback(
    async (sellerId: string, riderId: string) => {
      const { data, error } = await supabase.rpc('create_seller_rider_room', {
        p_seller_id: sellerId,
        p_rider_id: riderId
      })
      if (error) throw error
      return data
    },
    [supabase]
  )

  return {
    room,
    rooms,
    messages,
    loading,
    sending,
    sendMessage,
    markRead,
    loadRooms,
    createBuyerSellerRoom,
    createBuyerRiderRoom,
    createSellerRiderRoom
  }
}

