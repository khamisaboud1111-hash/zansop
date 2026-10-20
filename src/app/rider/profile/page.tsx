'use client'

import { useEffect, useMemo, useState } from 'react'
import { User, Phone, Mail, Star, Package, MapPin, Shield, LogOut, ChevronRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageLoader } from '@/components/ui'
import { formatTZS } from '@/utils'
import toast from 'react-hot-toast'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'

interface RiderProfile {
  id: string
  is_verified: boolean
  is_online: boolean
  account_status: string
  wallet_balance: number
  rating_average: number
  total_ratings: number
  total_deliveries: number
  payout_method?: string
  payout_account_number?: string
  vehicle_type?: string
  zone?: string
  created_at: string
}

export default function RiderProfilePage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editField, setEditField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState('')

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('rider_profiles').select('*').eq('id', profile!.id).single()
      setRiderProfile(data)
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  function startEdit(field: string, current: string) {
    setEditField(field)
    setFieldValue(current)
  }

  function cancelEdit() {
    setEditField(null)
    setFieldValue('')
  }

  async function saveField() {
    if (!editField || !profile) return
    setSaving(true)
    const updateData: Record<string, string | null> = {}
    updateData[editField] = fieldValue || null
    const { error } = await supabase.from('rider_profiles').update(updateData).eq('id', profile.id)
    if (error) {
      toast.error('Imeshindikana kusasisha')
    } else {
      setRiderProfile((prev) => prev ? { ...prev, [editField]: fieldValue } : prev)
      toast.success('Imesasishwa')
    }
    setSaving(false)
    setEditField(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="font-display font-black text-2xl text-white">{t('profile', lang)}</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-bold text-white">{profile?.full_name?.charAt(0)?.toUpperCase() ?? 'D'}</span>
          </div>
          <h2 className="font-display font-bold text-lg text-white">{profile?.full_name}</h2>
          <p className="text-sm text-neutral-500">{profile?.email}</p>
          {riderProfile?.is_verified && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full mt-2">
              <Shield className="w-3 h-3" /> {t('verifiedRider', lang)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 text-center">
            <Package className="w-5 h-5 text-brand-400 mx-auto mb-1" />
            <p className="font-display font-bold text-lg text-white">{riderProfile?.total_deliveries || 0}</p>
            <p className="text-[10px] text-neutral-500">{t('totalDeliveries', lang)}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 text-center">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="font-display font-bold text-lg text-white">{(riderProfile?.rating_average || 0).toFixed(1)}</p>
            <p className="text-[10px] text-neutral-500">{t('rating', lang)}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 text-center">
            <MapPin className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="font-display font-bold text-lg text-white">{formatTZS(riderProfile?.wallet_balance || 0)}</p>
            <p className="text-[10px] text-neutral-500">{t('riderWallet', lang)}</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <ProfileRow
            icon={<User className="w-5 h-5 text-neutral-400" />}
            label="Jina"
            value={profile?.full_name || '—'}
            editing={editField === 'full_name'}
            editValue={fieldValue}
            onEditValue={setFieldValue}
            onStartEdit={() => startEdit('full_name', profile?.full_name ?? '')}
            onSave={saveField}
            onCancel={cancelEdit}
            saving={saving}
          />
          <ProfileRow
            icon={<Phone className="w-5 h-5 text-neutral-400" />}
            label="Simu"
            value={riderProfile?.payout_account_number || profile?.phone || '—'}
            editing={editField === 'payout_account_number'}
            editValue={fieldValue}
            onEditValue={setFieldValue}
            onStartEdit={() => startEdit('payout_account_number', riderProfile?.payout_account_number ?? '')}
            onSave={saveField}
            onCancel={cancelEdit}
            saving={saving}
          />
          <ProfileRow
            icon={<Mail className="w-5 h-5 text-neutral-400" />}
            label="Barua Pepe"
            value={profile?.email || '—'}
            editing={false}
            editValue=""
            onEditValue={() => {}}
            onStartEdit={() => {}}
            onSave={() => {}}
            onCancel={() => {}}
            saving={false}
          />
          <ProfileRow
            icon={<MapPin className="w-5 h-5 text-neutral-400" />}
            label="Njia ya Malipo"
            value={riderProfile?.payout_method === 'mpesa' ? 'M-Pesa' : riderProfile?.payout_method === 'tigo_pesa' ? 'Tigo Pesa' : riderProfile?.payout_method === 'airtel_money' ? 'Airtel Money' : riderProfile?.payout_method === 'halopesa' ? 'Halopesa' : '—'}
            editing={editField === 'payout_method'}
            editValue={fieldValue}
            onEditValue={setFieldValue}
            onStartEdit={() => startEdit('payout_method', riderProfile?.payout_method ?? '')}
            onSave={saveField}
            onCancel={cancelEdit}
            saving={saving}
          />
        </div>

        <button onClick={handleSignOut} className="w-full bg-neutral-900 border border-neutral-800 text-red-400 font-semibold py-3 rounded-full text-sm inline-flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
          <LogOut className="w-4 h-4" /> {t('logout', lang)}
        </button>
      </div>
    </div>
  )
}

function ProfileRow({ icon, label, value, editing, editValue, onEditValue, onStartEdit, onSave, onCancel, saving }: {
  icon: React.ReactNode; label: string; value: string; editing: boolean; editValue: string
  onEditValue: (v: string) => void; onStartEdit: () => void; onSave: () => void
  onCancel: () => void; saving: boolean
}) {
  if (editing) {
    return (
      <div className="px-4 py-3 bg-brand-500/10 border-b border-neutral-800">
        <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider mb-2">{label}</p>
        <input value={editValue} onChange={e => onEditValue(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 w-full" autoFocus />
        <div className="flex gap-2 mt-2">
          <button onClick={onSave} disabled={saving} className="text-xs font-semibold text-brand-400 bg-brand-500/20 px-3 py-1.5 rounded-lg hover:bg-brand-500/30">
            {saving ? 'Inahifadhi...' : 'Hifadhi'}
          </button>
          <button onClick={onCancel} className="text-xs font-semibold text-neutral-500 bg-neutral-800 px-3 py-1.5 rounded-lg hover:bg-neutral-700">Ghairi</button>
        </div>
      </div>
    )
  }
  return (
    <button onClick={onStartEdit} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-800 transition-colors text-left border-b border-neutral-800 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
    </button>
  )
}

