'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useSeller } from '@/hooks/useSeller'
import { slugify } from '@/utils'
import { getDefaultDeliveryZones } from '@/lib/deliveryZones'
import { PageLoader } from '@/components/ui'
import { Camera, MapPin, Clock, Phone, Store, Globe, Save, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

// Derived from the single source of truth (src/lib/deliveryZones.ts) so the
// seller-facing zone list can never drift from checkout / the DB seed.
const CANONICAL_ZONES = getDefaultDeliveryZones()

const DAYS = ['Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi', 'Jumapili']

export default function SellerSettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const params = useSearchParams()
  const isOnboarding = params.get('onboarding') === 'true'
  const { profile, loading: authLoading } = useUser()
  const { seller, loading: sellerLoading, refetch } = useSeller()

  const [saving, setSaving] = useState(false)
  const [editField, setEditField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState('')

  const [logo, setLogo] = useState<string | undefined>()
  const [banner, setBanner] = useState<string | undefined>()
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [locating, setLocating] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const [whatsapp, setWhatsapp] = useState('')
  const [deliveryZones, setDeliveryZones] = useState<string[]>([])
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({})

  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (seller) {
      setLogo(seller.logo_url ?? undefined)
      setBanner(seller.banner_url ?? undefined)
      const s = seller as any
      if (s.latitude && s.longitude) setCoords({ lat: s.latitude, lng: s.longitude })
      setLocationLabel(s.location_label ?? '')
      setWhatsapp(seller.whatsapp_number ?? '')
      setDeliveryZones((s.delivery_zones as string[]) ?? [])
      const hours = s.operating_hours ?? {}
      const defaultHours: Record<string, { open: string; close: string; enabled: boolean }> = {}
      DAYS.forEach(d => {
        defaultHours[d] = hours[d] ?? { open: '08:00', close: '18:00', enabled: d !== 'Jumapili' }
      })
      setOperatingHours(defaultHours)
    }
  }, [seller])

  async function uploadImage(file: File, bucket: string, field: 'logo' | 'banner') {
    if (!profile) return
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/${field}.${ext}`
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (uploadError) { toast.error(uploadError.message); return }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    const publicUrl = data.publicUrl
    if (field === 'logo') setLogo(publicUrl)
    else setBanner(publicUrl)
    if (seller) {
      const updateData: any = { updated_at: new Date().toISOString() }
      updateData[field + '_url'] = publicUrl
      await supabase.from('sellers').update(updateData).eq('id', seller.id)
      refetch()
    }
    toast.success(field === 'logo' ? 'Logo imesasishwa' : 'Banner imesasishwa')
  }

  function startEdit(field: string, current: string) {
    setEditField(field)
    setFieldValue(current)
  }

  function cancelEdit() {
    setEditField(null)
    setFieldValue('')
  }

  async function saveField() {
    if (!editField || !seller) return
    setSaving(true)
    await supabase.from('sellers').update({ [editField]: fieldValue || null, updated_at: new Date().toISOString() }).eq('id', seller.id)
    refetch()
    toast.success('Imesasishwa')
    setSaving(false)
    setEditField(null)
  }

  async function saveLocation() {
    if (!seller) return
    setSaving(true)
    const s = seller as any
    await supabase.from('sellers').update({
      latitude: coords?.lat ?? s.latitude ?? null,
      longitude: coords?.lng ?? s.longitude ?? null,
      location_label: locationLabel || null,
      updated_at: new Date().toISOString(),
    }).eq('id', seller.id)
    refetch()
    toast.success('Eneo limebadilishwa')
    setSaving(false)
  }

  async function saveDeliverySettings() {
    if (!seller) return
    setSaving(true)
    await supabase.from('sellers').update({
      whatsapp_number: whatsapp,
      delivery_zones: deliveryZones,
      operating_hours: operatingHours,
      updated_at: new Date().toISOString(),
    }).eq('id', seller.id)
    refetch()
    toast.success('Mipangilio ya usafirishaji imesasishwa')
    setSaving(false)
  }

  async function handleCreateStore() {
    if (!profile || fieldValue.trim().length < 2) return
    setSaving(true)
    const slug = slugify(fieldValue) + '-' + Date.now().toString(36).slice(-4)
    const { error } = await supabase.from('sellers').insert({
      user_id: profile.id,
      store_name: fieldValue,
      store_slug: slug,
      whatsapp_number: profile.phone ?? '',
      status: 'pending',
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Duka limetengenezwa! Inasubiri idhini.')
    router.push('/seller/dashboard')
  }

  function toggleSection(section: string) {
    setActiveSection(activeSection === section ? null : section)
  }

  function toggleDeliveryZone(zone: string) {
    setDeliveryZones(prev => prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone])
  }

  if (authLoading || sellerLoading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-6">Mipangilio ya Duka</h1>

      {/* Hero Section - Banner + Logo */}
      <div className="card rounded-2xl overflow-hidden mb-6">
        <div className="relative h-36 sm:h-48 bg-gradient-to-br from-brand-400 via-brand-500 to-teal-500 overflow-hidden">
          {banner && <Image src={banner} alt="" width={600} height={200} unoptimized className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/20" />
          <button onClick={() => bannerRef.current?.click()}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-105">
            <Camera className="w-4 h-4 text-ink-700" />
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'seller-banners', 'banner') }} />
        </div>

        <div className="px-4 pb-4">
          <div className="relative -mt-12 mb-4 flex items-end gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white ring-4 ring-white shadow-lg">
                {logo ? (
                  <Image src={logo} alt="" width={96} height={96} unoptimized className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600">
                    <span className="text-3xl font-bold text-white">{seller?.store_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                  </div>
                )}
              </div>
              <button onClick={() => logoRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'seller-logos', 'logo') }} />
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h2 className="font-display font-bold text-lg text-ink-900 truncate">{seller?.store_name ?? 'Duka Langu'}</h2>
              {seller && (
                <span className={`inline-flex items-center text-[11px] font-semibold mt-0.5 px-2 py-0.5 rounded-full ${
                  seller.status === 'approved' ? 'text-emerald-600 bg-emerald-50'
                  : seller.status === 'pending' ? 'text-amber-600 bg-amber-50'
                  : 'text-red-600 bg-red-50'
                }`}>
                  {seller.status === 'approved' ? '✓ Imeidhinishwa' : seller.status === 'pending' ? '⏳ Inasubiri' : '✕ Imesimamishwa'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding banner */}
      {isOnboarding && !seller && (
        <div className="mb-4 px-4 py-3 bg-brand-50 border border-brand-100 rounded-xl">
          <p className="text-sm text-brand-800 font-medium">Karibu! Jaza maelezo ya duka lako ili kuanza kuuza.</p>
        </div>
      )}

      {seller ? (
        <div className="space-y-3">
          {/* Store Details */}
          <SettingsSection
            icon={<Store className="w-5 h-5" />}
            title="Maelezo ya Duka"
            isOpen={activeSection === 'details'}
            onToggle={() => toggleSection('details')}
          >
            <SettingsRow label="Jina la Duka" value={seller.store_name}
              editing={editField === 'store_name'} editValue={fieldValue}
              onEditValue={setFieldValue} onStartEdit={() => startEdit('store_name', seller.store_name)}
              onSave={saveField} onCancel={cancelEdit} saving={saving} />
            <SettingsRow label="Maelezo" value={seller.description || '—'}
              editing={editField === 'description'} editValue={fieldValue}
              onEditValue={setFieldValue} onStartEdit={() => startEdit('description', seller.description ?? '')}
              onSave={saveField} onCancel={cancelEdit} saving={saving} textarea />
          </SettingsSection>

          {/* Contact */}
          <SettingsSection
            icon={<Phone className="w-5 h-5" />}
            title="Mawasiliano"
            isOpen={activeSection === 'contact'}
            onToggle={() => toggleSection('contact')}
          >
            <div className="px-4 py-3">
              <label className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider">WhatsApp</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                className="input text-sm mt-1" placeholder="+255 7XX XXX XXX" />
            </div>
          </SettingsSection>

          {/* Location */}
          <SettingsSection
            icon={<MapPin className="w-5 h-5" />}
            title="Eneo"
            isOpen={activeSection === 'location'}
            onToggle={() => toggleSection('location')}
          >
            <div className="px-4 py-3 space-y-3">
              <input value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)}
                className="input text-sm" placeholder="mf. Mji Mkongwe, Zanzibar" />
              <div className="flex gap-2">
                <button type="button" disabled={locating} onClick={() => {
                  if (!navigator.geolocation) { toast.error('Geolocation haijaungwa'); return }
                  setLocating(true)
                  navigator.geolocation.getCurrentPosition(
                    (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success('Eneo limepatikana') },
                    () => { setLocating(false); toast.error('Imeshindwa kupata eneo') },
                    { enableHighAccuracy: true, timeout: 10000 }
                  )
                }} className="flex-1 btn-secondary text-xs justify-center py-2">
                  {locating ? 'Inapata eneo...' : coords ? 'Badilisha eneo' : 'Tumia eneo langu'}
                </button>
                <button onClick={saveLocation} disabled={saving} className="btn-primary text-xs py-2 px-4 gap-1">
                  <Save className="w-3 h-3" /> Hifadhi
                </button>
              </div>
              {coords && <p className="text-[11px] text-brand-600">✓ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>}
            </div>
          </SettingsSection>

          {/* Delivery Zones */}
          <SettingsSection
            icon={<Globe className="w-5 h-5" />}
            title="Maeneo ya Usafirishaji"
            isOpen={activeSection === 'delivery'}
            onToggle={() => toggleSection('delivery')}
          >
            <div className="px-4 py-3">
              <p className="text-xs text-ink-500 mb-3">Chagua maeneo unayofikisha bidhaa:</p>
              <div className="grid grid-cols-2 gap-2">
                {CANONICAL_ZONES.map(z => (
                  <button key={z.zone} onClick={() => toggleDeliveryZone(z.zone)}
                    className={`text-left text-xs font-medium px-3 py-2 rounded-xl border transition-all ${
                      deliveryZones.includes(z.zone)
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-ink-200 text-ink-600 hover:border-ink-300'
                    }`}>
                    {deliveryZones.includes(z.zone) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {z.name_sw}
                  </button>
                ))}
              </div>
            </div>
          </SettingsSection>

          {/* Operating Hours */}
          <SettingsSection
            icon={<Clock className="w-5 h-5" />}
            title="Saa za Kazi"
            isOpen={activeSection === 'hours'}
            onToggle={() => toggleSection('hours')}
          >
            <div className="px-4 py-3 space-y-2">
              {DAYS.map(day => {
                const h = operatingHours[day] ?? { open: '08:00', close: '18:00', enabled: true }
                return (
                  <div key={day} className={`flex items-center gap-3 py-2 ${!h.enabled ? 'opacity-50' : ''}`}>
                    <button onClick={() => setOperatingHours(prev => ({
                      ...prev, [day]: { ...h, enabled: !h.enabled }
                    }))} className={`w-10 h-5 rounded-full transition-colors relative ${h.enabled ? 'bg-brand-500' : 'bg-ink-200'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${h.enabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <span className="text-xs font-medium text-ink-700 w-20">{day}</span>
                    {h.enabled ? (
                      <div className="flex items-center gap-1 text-xs">
                        <input type="time" value={h.open}
                          onChange={e => setOperatingHours(prev => ({ ...prev, [day]: { ...h, open: e.target.value } }))}
                          className="input text-xs py-1 px-2 w-24" />
                        <span className="text-ink-400">—</span>
                        <input type="time" value={h.close}
                          onChange={e => setOperatingHours(prev => ({ ...prev, [day]: { ...h, close: e.target.value } }))}
                          className="input text-xs py-1 px-2 w-24" />
                      </div>
                    ) : (
                      <span className="text-xs text-ink-400">Imefungwa</span>
                    )}
                  </div>
                )
              })}
            </div>
          </SettingsSection>

          {/* Save All */}
          <div className="pt-2">
            <button onClick={saveDeliverySettings} disabled={saving} className="btn-primary w-full justify-center py-3 text-sm gap-1.5">
              <Save className="w-4 h-4" /> {saving ? 'Inahifadhi...' : 'Hifadhi Mipangilio Yote'}
            </button>
          </div>
        </div>
      ) : (
        /* Create store form */
        <div className="card rounded-2xl overflow-hidden">
          <div className="px-4 py-4 space-y-3">
            <p className="text-sm font-semibold text-ink-900">Jina gani la duka lako?</p>
            <input value={fieldValue} onChange={(e) => setFieldValue(e.target.value)}
              className="input text-sm" placeholder="mf. Spice Island Store" autoFocus />
            <button onClick={handleCreateStore} disabled={saving || fieldValue.trim().length < 2}
              className="btn-primary w-full justify-center py-2.5 text-sm">
              {saving ? 'Inaunda...' : 'Unda Duka'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsSection({ icon, title, isOpen, onToggle, children }: {
  icon: React.ReactNode; title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50 transition-colors text-left">
        <div className="w-8 h-8 rounded-xl bg-ink-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <span className="flex-1 text-sm font-semibold text-ink-800">{title}</span>
        <ChevronRight className={`w-4 h-4 text-ink-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && <div className="border-t border-ink-100">{children}</div>}
    </div>
  )
}

function SettingsRow({ label, value, editing, editValue, onEditValue, onStartEdit, onSave, onCancel, saving, textarea }: {
  label: string; value: string; editing: boolean; editValue: string; onEditValue: (v: string) => void
  onStartEdit: () => void; onSave: () => void; onCancel: () => void; saving: boolean; textarea?: boolean
}) {
  if (editing) {
    return (
      <div className="px-4 py-3 bg-brand-50/50">
        <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider mb-2">{label}</p>
        {textarea ? (
          <textarea value={editValue} onChange={(e) => onEditValue(e.target.value)}
            className="input text-sm min-h-[80px]" autoFocus />
        ) : (
          <input value={editValue} onChange={(e) => onEditValue(e.target.value)} className="input text-sm" autoFocus />
        )}
        <div className="flex gap-2 mt-2">
          <button onClick={onSave} disabled={saving} className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
            {saving ? 'Inahifadhi...' : 'Hifadhi'}
          </button>
          <button onClick={onCancel} className="text-xs font-semibold text-ink-500 bg-ink-50 px-3 py-1.5 rounded-lg hover:bg-ink-100 transition-colors">Ghairi</button>
        </div>
      </div>
    )
  }
  return (
    <button onClick={onStartEdit} className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink-50 transition-colors text-left">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-ink-900 truncate">{value}</p>
      </div>
      <span className="text-xs text-brand-600 font-medium flex-shrink-0 ml-2">Badilisha</span>
    </button>
  )
}

