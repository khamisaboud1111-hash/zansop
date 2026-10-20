'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, X, Pause, Play, MessageCircle, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SellerStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog, PageLoader, EmptyState } from '@/components/ui'
import { formatDate, whatsappUrl } from '@/utils'
import Image from 'next/image'
import type { Seller, SellerStatus } from '@/types'
import toast from 'react-hot-toast'

export default function AdminSellersPage() {
  const supabase = useMemo(() => createClient(), [])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | SellerStatus>('pending')
  const [confirmAction, setConfirmAction] = useState<{ seller: Seller; action: SellerStatus } | null>(null)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('sellers').select(`*, profile:profiles(full_name, email, phone, created_at)`).order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) {
      console.error('Failed to load sellers:', error.message)
      toast.error('Imeshindikana kupakia wauuzaji')
    }
    setSellers(data ?? [])
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => { load() }, [load])

  async function handleAction() {
    if (!confirmAction) return
    setProcessing(true)
    const { seller, action } = confirmAction

    await supabase.from('sellers').update({
      status: action,
      verified_at: action === 'approved' ? new Date().toISOString() : null,
    }).eq('id', seller.id)

    // Notify seller
    const messages: Record<string, { titleEn: string; titleSw: string; bodyEn: string; bodySw: string; type: string }> = {
      approved:  { titleEn: 'Seller approved!', titleSw: 'Umeidhinishwa!', bodyEn: 'Your store is now live on Zanshop.', bodySw: 'Duka lako sasa linaonekana kwenye Zanshop.', type: 'seller_approved' },
      suspended: { titleEn: 'Account suspended', titleSw: 'Akaunti imesimamishwa', bodyEn: 'Your seller account has been suspended.', bodySw: 'Akaunti yako ya muuzaji imesimamishwa.', type: 'seller_suspended' },
      pending:   { titleEn: 'Account reactivated', titleSw: 'Akaunti imerejeshwa', bodyEn: 'Your account is active again.', bodySw: 'Akaunti yako imefanya kazi tena.', type: 'seller_approved' },
    }
    const msg = messages[action]
    if (msg) {
      await supabase.from('notifications').insert({
        user_id: seller.user_id,
        type: msg.type,
        title_en: msg.titleEn, title_sw: msg.titleSw,
        body_en: msg.bodyEn, body_sw: msg.bodySw,
        link: '/seller/dashboard',
      })
    }

    toast.success(`Hali ya ${seller.store_name} imebadilishwa`)
    setConfirmAction(null)
    setProcessing(false)
    load()
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-5">Wauuzaji</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {(['pending', 'approved', 'suspended', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${filter === f ? 'bg-brand-500 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-300'}`}>
            {f === 'pending' ? 'Wanaosubiri' : f === 'approved' ? 'Wameidhinishwa' : f === 'suspended' ? 'Wamesimamishwa' : 'Wote'}
          </button>
        ))}
      </div>

      {sellers.length === 0 ? (
        <EmptyState title="Hakuna wauuzaji" description={`Hakuna wauuzaji wenye hali "${filter}"`} />
      ) : (
        <div className="space-y-3">
          {sellers.map((seller: any) => {
            const waUrl = whatsappUrl(seller.whatsapp_number, `Habari ${seller.store_name}, hii ni Zanshop Admin.`)
            return (
              <div key={seller.id} className="card p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    {seller.logo_url ? (
                      <Image src={seller.logo_url} alt="" width={48} height={48} unoptimized className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-700 font-bold text-lg">{seller.store_name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-ink-900">{seller.store_name}</p>
                        <SellerStatusBadge status={seller.status} />
                      </div>
                      <p className="text-xs text-ink-500">{seller.profile?.full_name} · {seller.profile?.email}</p>
                      <p className="text-xs text-ink-400 mt-0.5">Aliomba: {formatDate(seller.created_at)}</p>
                      {seller.average_rating > 0 && (
                        <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {seller.average_rating.toFixed(1)} · Mauzo {seller.total_sales}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={waUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    {seller.status === 'pending' && (
                      <>
                        <button onClick={() => setConfirmAction({ seller, action: 'approved' })} className="btn-primary text-xs py-2 px-3 gap-1">
                          <Check className="w-3.5 h-3.5" /> Idhinisha
                        </button>
                        <button onClick={() => setConfirmAction({ seller, action: 'suspended' })} className="btn-danger text-xs py-2 px-3 gap-1">
                          <X className="w-3.5 h-3.5" /> Kataa
                        </button>
                      </>
                    )}
                    {seller.status === 'approved' && (
                      <button onClick={() => setConfirmAction({ seller, action: 'suspended' })} className="btn-secondary text-xs py-2 px-3 gap-1 text-red-600">
                        <Pause className="w-3.5 h-3.5" /> Simamisha
                      </button>
                    )}
                    {seller.status === 'suspended' && (
                      <button onClick={() => setConfirmAction({ seller, action: 'approved' })} className="btn-secondary text-xs py-2 px-3 gap-1 text-emerald-600">
                        <Play className="w-3.5 h-3.5" /> Rejesha
                      </button>
                    )}
                  </div>
                </div>
                {seller.description && (
                  <p className="text-xs text-ink-500 mt-3 pt-3 border-t border-ink-100">{seller.description}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title="Thibitisha kitendo" size="sm">
        {confirmAction && (
          <ConfirmDialog
            message={`Una uhakika unataka ku-${confirmAction.action === 'approved' ? 'idhinisha' : confirmAction.action === 'suspended' ? 'simamisha' : 'badilisha'} "${confirmAction.seller.store_name}"?`}
            onConfirm={handleAction}
            onCancel={() => setConfirmAction(null)}
            loading={processing}
            variant={confirmAction.action === 'approved' ? 'primary' : 'danger'}
          />
        )}
      </Modal>
    </div>
  )
}


