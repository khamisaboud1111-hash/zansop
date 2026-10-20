'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Search, MoreVertical, Phone, Star, Clock, ChevronLeft, AlertCircle } from 'lucide-react'
import { useSeller } from '@/hooks/useSeller'
import { useUser } from '@/hooks/useUser'
import { useChat } from '@/hooks/useChat'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import BuyerSellerChat from '@/components/chat/BuyerSellerChat'
import Image from 'next/image'

interface RoomPreview {
  id: string
  buyer_id: string
  buyer_name: string
  buyer_avatar?: string | null
  last_message: string | null
  last_at: string | null
  unread_count: number
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'sasa'
  if (mins < 60) return `${mins}d`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}s`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}m`
  return new Date(iso).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })
}

export default function SellerMessagesPage() {
  const supabase = useMemo(() => createClient(), [])
  const { seller, loading: sellerLoading } = useSeller()
  const { profile } = useUser()
  const [rooms, setRooms] = useState<RoomPreview[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [roomsError, setRoomsError] = useState<string | null>(null)
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(true)

  useEffect(() => {
    if (!seller) return
    loadRooms()
  }, [seller])

  async function loadRooms() {
    setLoadingRooms(true)
    setRoomsError(null)
    try {
      const { data: roomRows, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id, buyer_id, buyer:profiles!buyer_id(full_name, avatar_url)')
        .eq('seller_id', seller!.id)

      if (roomError) throw roomError

      const senderId = profile?.id ?? ''
      const previews: RoomPreview[] = await Promise.all(
        (roomRows ?? []).map(async (r) => {
          const [lastMsgResult, unreadResult] = await Promise.all([
            supabase
              .from('messages')
              .select('body, created_at')
              .eq('room_id', r.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('room_id', r.id)
              .is('read_at', null)
              .neq('sender_id', senderId),
          ])

          return {
            id: r.id,
            buyer_id: r.buyer_id,
            buyer_name: (r as any).buyer?.full_name ?? 'Customer',
            buyer_avatar: (r as any).buyer?.avatar_url,
            last_message: lastMsgResult.data?.body ?? null,
            last_at: lastMsgResult.data?.created_at ?? null,
            unread_count: unreadResult.count ?? 0,
          }
        })
      )

      previews.sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''))
      setRooms(previews)
    } catch (err) {
      console.error('Load rooms error:', err)
      setRoomsError('Failed to load messages. Please try again later.')
    } finally {
      setLoadingRooms(false)
    }
  }

  const { messages, loading, sending, sendMessage, markRead } = useChat({ buyerId: activeBuyerId ?? undefined, sellerId: seller?.id, participantType: 'buyer_seller' })

  const filteredRooms = rooms.filter(r =>
    !search || r.buyer_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = rooms.reduce((s, r) => s + r.unread_count, 0)

  if (sellerLoading || loadingRooms) return <PageLoader />

  if (roomsError) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-black text-2xl text-ink-900">Messages</h1>
        </div>
        <div className="card p-6 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">Unable to load messages</h3>
          <p className="text-ink-500 dark:text-ink-400 mb-4">{roomsError}</p>
          <button onClick={loadRooms} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const activeRoom = rooms.find((r) => r.buyer_id === activeBuyerId)

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900">Ujumbe</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {totalUnread > 0 ? `${totalUnread} mpya` : `${rooms.length} mazungumzo`}
          </p>
        </div>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="w-10 h-10" />}
          title="Bado hakuna ujumbe"
          description="Ujumbe kutoka kwa wateja utaonekana hapa"
        />
      ) : (
        <div className="card rounded-2xl overflow-hidden">
          <div className={`grid sm:grid-cols-[320px_1fr] ${!showList && activeBuyerId ? 'grid-cols-1' : ''}`}>
            {/* Conversations List */}
            <div className={`border-r border-ink-100 ${!showList && activeBuyerId ? 'hidden sm:block' : ''}`}>
              {/* Search */}
              <div className="p-3 border-b border-ink-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Tafuta mteja..."
                    className="input pl-9 text-sm w-full" />
                </div>
              </div>

              {/* Room List */}
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredRooms.map(r => {
                  const isActive = activeBuyerId === r.buyer_id
                  return (
                    <button key={r.id} onClick={() => { setActiveBuyerId(r.buyer_id); setShowList(false) }}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-ink-50 ${
                        isActive ? 'bg-brand-50' : 'hover:bg-ink-50'
                      }`}>
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {r.buyer_avatar ? (
                          <Image src={r.buyer_avatar} alt="" width={44} height={44} unoptimized className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                            isActive ? 'bg-brand-200 text-brand-700' : 'bg-ink-100 text-ink-600'
                          }`}>
                            {r.buyer_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {r.unread_count > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                            {r.unread_count}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${r.unread_count > 0 ? 'font-bold text-ink-900' : 'font-medium text-ink-800'}`}>
                            {r.buyer_name}
                          </p>
                          {r.last_at && (
                            <span className={`text-[10px] flex-shrink-0 ml-2 ${r.unread_count > 0 ? 'text-brand-600 font-semibold' : 'text-ink-400'}`}>
                              {relativeTime(r.last_at)}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${r.unread_count > 0 ? 'text-ink-700 font-medium' : 'text-ink-400'}`}>
                          {r.last_message ?? 'Hakuna ujumbe bado'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`${!showList && activeBuyerId ? '' : 'hidden sm:block'} min-h-[50vh] sm:min-h-0`}>
              {activeBuyerId && activeRoom && profile ? (
                <div className="h-full">
                  {/* Mobile back button */}
                  <div className="sm:hidden px-3 py-2 border-b border-ink-100 flex items-center gap-2">
                    <button onClick={() => { setShowList(true); setActiveBuyerId(null) }}
                      className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
                      {activeRoom.buyer_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-sm text-ink-900 truncate">{activeRoom.buyer_name}</p>
                  </div>
                  <div className="h-[calc(100%-48px)] sm:h-full">
                    <BuyerSellerChat
                      messages={messages}
                      currentUserId={profile.id}
                      otherPartyName={activeRoom.buyer_name}
                      loading={loading}
                      sending={sending}
                      onSend={(body) => sendMessage(body, profile.id).then(() => {})}
                      onMarkRead={() => {
                        markRead(profile.id)
                        setRooms((prev) => prev.map((r) => (r.buyer_id === activeBuyerId ? { ...r, unread_count: 0 } : r)))
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[50vh] sm:min-h-0 flex flex-col items-center justify-center text-sm text-ink-400 p-6">
                  <MessageCircle className="w-12 h-12 text-ink-200 mb-3" />
                  <p className="font-medium text-ink-500">Chagua mazungumzo</p>
                  <p className="text-xs text-ink-400 mt-1">Upande wa kushoto kuchagua mteja</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

