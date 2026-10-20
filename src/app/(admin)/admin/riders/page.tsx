'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, X, ExternalLink, Bike, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatDate } from '@/utils'
import toast from 'react-hot-toast'

interface RiderRow {
  id: string
  national_id: string
  driving_license: string
  motorcycle_registration: string
  emergency_contact: string
  payout_method: string
  payout_account_number: string
  selfie_url: string | null
  license_scan_url: string | null
  is_verified: boolean
  account_status: 'active' | 'suspended'
  rating_average: number
  total_deliveries: number
  created_at: string
  profile?: { full_name: string; phone: string | null }
}

type FilterTab = 'pending' | 'verified' | 'suspended' | 'all'

export default function AdminRidersPage() {
  const supabase = useMemo(() => createClient(), [])
  const [riders, setRiders] = useState<RiderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function load() {
    setLoading(true)
    let q = supabase.from('rider_profiles').select('*, profile:profiles(full_name, phone)').order('created_at', { ascending: false })

    if (filter === 'pending') q = q.eq('is_verified', false).eq('account_status', 'active')
    if (filter === 'verified') q = q.eq('is_verified', true).eq('account_status', 'active')
    if (filter === 'suspended') q = q.eq('account_status', 'suspended')

    const { data, error } = await q
    if (error) {
      console.error('Failed to load riders:', error.message)
      toast.error('Imeshindikana kupakia madereva')
    }
    setRiders((data as any) ?? [])
    setLoading(false)
  }

  // rider-documents is a PRIVATE bucket (Phase 8) — generate short-lived
  // signed URLs on demand rather than public links.
  async function getDocUrl(path: string | null): Promise<string | null> {
    if (!path) return null
    if (docUrls[path]) return docUrls[path]
    const { data, error } = await supabase.storage.from('rider-documents').createSignedUrl(path, 300)
    if (error || !data) return null
    setDocUrls((prev) => ({ ...prev, [path]: data.signedUrl }))
    return data.signedUrl
  }

  async function openDoc(path: string | null) {
    const url = await getDocUrl(path)
    if (url) window.open(url, '_blank')
    else toast.error('Imeshindikana kufungua hati')
  }

  async function approve(rider: RiderRow) {
    setProcessing(rider.id)
    const { error } = await supabase
      .from('rider_profiles')
      .update({ is_verified: true, account_status: 'active' })
      .eq('id', rider.id)
    setProcessing(null)
    if (error) { toast.error('Imeshindikana kuthibitisha'); return }
    toast.success('Dereva amethibitishwa')
    load()
  }

  async function suspend(rider: RiderRow) {
    setProcessing(rider.id)
    const { error } = await supabase
      .from('rider_profiles')
      .update({ is_verified: false, account_status: 'suspended', is_online: false })
      .eq('id', rider.id)
    setProcessing(null)
    if (error) { toast.error('Imeshindikana'); return }
    toast.success('Dereva amesimamishwa')
    load()
  }

  async function reactivate(rider: RiderRow) {
    setProcessing(rider.id)
    const { error } = await supabase
      .from('rider_profiles')
      .update({ account_status: 'active', is_verified: true })
      .eq('id', rider.id)
    setProcessing(null)
    if (error) { toast.error('Imeshindikana'); return }
    toast.success('Dereva amerejeshwa')
    load()
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-black text-xl text-ink-900 flex items-center gap-2">
          <Bike className="w-5 h-5" /> Madereva
        </h1>
        <div className="flex gap-2">
          {(['pending', 'verified', 'suspended', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${filter === f ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600'}`}
            >
              {f === 'pending' ? 'Wanasubiri' : f === 'verified' ? 'Wamethibitishwa' : f === 'suspended' ? 'Wamesimamishwa' : 'Wote'}
            </button>
          ))}
        </div>
      </div>

      {riders.length === 0 ? (
        <EmptyState icon={<Bike className="w-10 h-10" />} title="Hakuna madereva" description="Hakuna madereva katika kundi hili" />
      ) : (
        <div className="space-y-3">
          {riders.map((rider) => (
            <div key={rider.id} className="card p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold text-sm text-ink-900">{rider.profile?.full_name ?? 'Dereva'}</p>
                  <p className="text-xs text-ink-500">{rider.profile?.phone} · Tarehe: {formatDate(rider.created_at)}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-ink-600">
                    <span>Kitambulisho: <strong>{rider.national_id}</strong></span>
                    <span>Leseni: <strong>{rider.driving_license}</strong></span>
                    <span>Pikipiki: <strong>{rider.motorcycle_registration}</strong></span>
                    <span>Dharura: <strong>{rider.emergency_contact}</strong></span>
                    <span>Malipo: <strong>{rider.payout_method.replace('_', ' ')} — {rider.payout_account_number}</strong></span>
                  </div>
                  {rider.total_deliveries > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {(rider.rating_average ?? 0).toFixed(1)} · {rider.total_deliveries} safari
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <button onClick={() => openDoc(rider.selfie_url)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                    Selfie <ExternalLink className="w-3 h-3" />
                  </button>
                  <button onClick={() => openDoc(rider.license_scan_url)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                    Leseni <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex gap-2">
                  {!rider.is_verified && rider.account_status === 'active' && (
                    <>
                      <button
                        disabled={!!processing}
                        onClick={() => approve(rider)}
                        className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200"
                        title="Thibitisha"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        disabled={!!processing}
                        onClick={() => suspend(rider)}
                        className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                        title="Kataa"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {rider.is_verified && rider.account_status === 'active' && (
                    <button
                      disabled={!!processing}
                      onClick={() => suspend(rider)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      Simamisha
                    </button>
                  )}
                  {rider.account_status === 'suspended' && (
                    <button
                      disabled={!!processing}
                      onClick={() => reactivate(rider)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    >
                      Rejesha
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

