'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Percent, Check, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatCard, PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import type { CommissionRecord } from '@/types'
import toast from 'react-hot-toast'

export default function AdminCommissionsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [commissions, setCommissions] = useState<CommissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'unpaid' | 'paid' | 'all'>('unpaid')
  const [payingId, setPayingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('commissions')
      .select(`*, seller:sellers(store_name, whatsapp_number)`)
      .order('created_at', { ascending: false })
    if (filter === 'unpaid') q = q.eq('is_paid', false)
    if (filter === 'paid') q = q.eq('is_paid', true)
    const { data, error } = await q
    if (error) {
      console.error('Failed to load commissions:', error.message)
      toast.error('Imeshindikana kupakia kamisheni')
    }
    setCommissions(data ?? [])
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => { load() }, [load])

  async function markPaid(id: string) {
    setPayingId(id)
    await supabase.from('commissions').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('id', id)
    toast.success('Imewekwa kama imelipwa')
    setPayingId(null)
    load()
  }

  const totalUnpaid = commissions.filter((c) => !c.is_paid).reduce((s, c) => s + c.commission_amount, 0)
  const totalPaid = commissions.filter((c) => c.is_paid).reduce((s, c) => s + c.commission_amount, 0)

  const bySeller: Record<string, { name: string; total: number; count: number; records: CommissionRecord[] }> = {}
  commissions.forEach((c) => {
    const key = c.seller_id
    if (!bySeller[key]) bySeller[key] = { name: c.seller?.store_name ?? 'Unknown', total: 0, count: 0, records: [] }
    bySeller[key].total += c.commission_amount
    bySeller[key].count += 1
    bySeller[key].records.push(c)
  })

  if (loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-5">Usimamizi wa Kamisheni</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Kamisheni Isiyolipwa" value={formatTZS(totalUnpaid)} icon={<DollarSign className="w-5 h-5" />} accent="spice" />
        <StatCard label="Kamisheni Iliyolipwa" value={formatTZS(totalPaid)} icon={<Percent className="w-5 h-5" />} accent="green" />
      </div>

      <div className="flex gap-2 mb-5">
        {(['unpaid', 'paid', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-brand-500 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-300'}`}>
            {f === 'unpaid' ? 'Hazijalipwa' : f === 'paid' ? 'Zimelipwa' : 'Zote'}
          </button>
        ))}
      </div>

      {Object.keys(bySeller).length === 0 ? (
        <EmptyState icon={<Percent className="w-10 h-10" />} title="Hakuna kamisheni" />
      ) : (
        <div className="space-y-4">
          {Object.entries(bySeller).map(([sellerId, group]) => (
            <div key={sellerId} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-ink-900">{group.name}</p>
                  <p className="text-xs text-ink-500">{group.count} maagizo</p>
                </div>
                <p className="font-black text-lg text-spice-600">{formatTZS(group.total)}</p>
              </div>
              <div className="divide-y divide-ink-100">
                {group.records.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm text-ink-700">Agizo #{c.order_id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-ink-400">{formatDate(c.created_at)} · {c.commission_rate}% ya {formatTZS(c.order_amount)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-ink-900">{formatTZS(c.commission_amount)}</span>
                      {c.is_paid ? (
                        <span className="badge-green text-xs"><Check className="w-3 h-3" /> Imelipwa</span>
                      ) : (
                        <button onClick={() => markPaid(c.id)} disabled={payingId === c.id} className="btn-secondary text-xs py-1.5 px-3">
                          {payingId === c.id ? '...' : 'Weka kama imelipwa'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

