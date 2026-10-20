'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useChat } from '@/hooks/useChat'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import { PageHeader } from '@/components/shared/PageHeader'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import BuyerSellerChat from '@/components/chat/BuyerSellerChat'

export default function BuyerMessagePage() {
  const params = useParams<{ sellerId: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { profile, loading: userLoading } = useUser()
  const { lang } = useLangStore()
  const [storeName, setStoreName] = useState('')
  const [loadingStore, setLoadingStore] = useState(true)

  const { messages, loading, sending, sendMessage, markRead } = useChat({ buyerId: profile?.id, sellerId: params.sellerId, participantType: 'buyer_seller' })

  useEffect(() => {
    supabase
      .from('sellers')
      .select('store_name')
      .eq('id', params.sellerId)
      .single()
      .then(({ data }) => {
        if (data) setStoreName(data.store_name)
        setLoadingStore(false)
      })
  }, [params.sellerId])

  if (userLoading || loadingStore) return <PageLoader />

  if (!profile) {
    return (
      <main className="pb-20 sm:pb-8 min-h-screen">
        <div className="page-container py-4 sm:py-8">
          <PageHeader
            title={<span className="flex items-center gap-3"><MessageCircle className="w-6 h-6 text-brand-500" />{t('messages', lang)}</span>}
            className="mb-6"
          />
          <EmptyState
            icon={<MessageCircle className="w-10 h-10" />}
            title={t('loginToChat', lang)}
            action={<Link href={`/login?redirect=/messages/${params.sellerId}`} className="btn-primary">{t('login', lang)}</Link>}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-6 max-w-lg mx-auto h-[calc(100vh-88px)] flex flex-col">
        <PageHeader
          title={storeName || t('messages', lang)}
          onBack={() => router.back()}
          backLabel={t('back', lang)}
          className="mb-4"
        />
        <div className="flex-1 min-h-0">
          <BuyerSellerChat
            messages={messages}
            currentUserId={profile.id}
            otherPartyName={storeName || t('messages', lang)}
            loading={loading}
            sending={sending}
            onSend={async (body) => { await sendMessage(body, profile.id) }}
            onMarkRead={() => markRead(profile.id)}
          />
        </div>
      </div>
    </main>
  )
}
