'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { PageLoader } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import { getDefaultDeliveryZones } from '@/lib/deliveryZones'
import type { DeliveryZone } from '@/types'
import toast from 'react-hot-toast'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import Image from 'next/image'
import { ProfileRow } from '@/components/settings/ProfileRow'
import { SectionRow } from '@/components/settings/SectionRow'

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { profile, loading: authLoading } = useUser()
  const lang = useLangStore((s) => s.lang)

  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)

  const [editField, setEditField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState('')

  const [passwordForm, setPasswordForm] = useState({ current: '', password: '', confirm: '' })
  const [emailValue, setEmailValue] = useState('')

  const [avatar, setAvatar] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/login')
    }
  }, [authLoading, profile])

  useEffect(() => {
    if (profile) {
      setAvatar(profile.avatar_url ?? undefined)
    }
  }, [profile?.avatar_url])

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = publicUrl
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (updateError) { toast.error(updateError.message) } else { setAvatar(url); toast.success(t('photoUpdated', lang)) }
    setUploading(false)
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
    if (!profile || !editField) return
    setSaving(true)
    const update: Record<string, string | null> = { updated_at: new Date().toISOString() }
    if (editField === 'full_name') update.full_name = fieldValue
    else if (editField === 'phone') update.phone = fieldValue || null
    else if (editField === 'delivery_zone') update.delivery_zone = (fieldValue || null) as DeliveryZone | null
    else if (editField === 'delivery_address') update.delivery_address = fieldValue || null
    const { error } = await supabase.from('profiles').update(update).eq('id', profile.id)
    if (error) { toast.error(error.message) } else { toast.success(t('updatedLabel', lang)); router.refresh() }
    setSaving(false)
    setEditField(null)
  }

  async function handleChangePassword() {
    if (passwordForm.password.length < 6) { toast.error(t('passwordTooShort', lang)); return }
    if (passwordForm.password !== passwordForm.confirm) { toast.error(t('passwordsDontMatch', lang)); return }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password })
    if (error) { toast.error(error.message) } else { toast.success(t('passwordUpdated', lang)); setPasswordForm({ current: '', password: '', confirm: '' }) }
    setChangingPassword(false)
  }

  async function handleChangeEmail() {
    if (!emailValue.includes('@')) { toast.error(t('invalidEmail', lang)); return }
    setChangingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: emailValue })
    if (error) { toast.error(error.message) } else { toast.success(t('checkInbox', lang)) }
    setChangingEmail(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: deleteText }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || t('deleteFailed', lang)); setDeleting(false); return }
    await supabase.auth.signOut()
    toast.success(t('accountDeleted', lang))
    router.push('/')
    router.refresh()
  }

  if (authLoading || !profile) return <PageLoader />

  const roleBadge = ({
    buyer: { label: t('buyerRole', lang), color: 'bg-brand-500' },
    seller: { label: t('sellerRole', lang), color: 'bg-emerald-500' },
    rider: { label: t('riderRole', lang), color: 'bg-amber-500' },
  } as Record<string, { label: string; color: string }>)[profile.role] ?? { label: 'User', color: 'bg-ink-400' }

  return (
    <div className="max-w-lg mx-auto py-0">
      {/* Profile Header — WhatsApp Style */}
      <div className="bg-white dark:bg-ink-900">
        <div className="relative pt-12 pb-6 flex flex-col items-center">
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-muted ring-4 ring-card shadow-lg">
              {avatar ? (
                <Image src={avatar} alt="" width={112} height={112} unoptimized className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600">
                  <span className="text-4xl font-bold text-white">{profile.full_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 border-2 border-white dark:border-ink-900"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          </div>
          {uploading && <p className="text-xs text-brand-500 mb-1">{t('uploadingLabel', lang)}</p>}
          <h1 className="font-display font-bold text-xl text-foreground">{profile.full_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full ${roleBadge.color}`}>
              {profile.email}
            </span>
          </div>
        </div>
      </div>

      {/* Info Section — Clean Rows */}
      <div className="px-4 -mt-2 space-y-3 pb-4">
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden divide-y divide-ink-100 dark:divide-ink-800">
          <ProfileRow
            icon={
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
            }
            label={t('name', lang)}
            value={profile.full_name}
            editing={editField === 'full_name'}
            editValue={fieldValue}
            onEditValue={setFieldValue}
            onStartEdit={() => startEdit('full_name', profile.full_name ?? '')}
            onSave={saveField}
            onCancel={cancelEdit}
            saving={saving}
          />
          <ProfileRow
            icon={
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            }
            label={t('phone', lang)}
            value={profile.phone ?? '—'}
            editing={editField === 'phone'}
            editValue={fieldValue}
            onEditValue={setFieldValue}
            onStartEdit={() => startEdit('phone', profile.phone ?? '')}
            onSave={saveField}
            onCancel={cancelEdit}
            saving={saving}
          />
          <ProfileRow
            icon={
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            }
            label={t('zone', lang)}
            value={profile.delivery_zone ? (getDefaultDeliveryZones().find(z => z.zone === profile.delivery_zone)?.name_en ?? profile.delivery_zone) : '—'}
            editing={editField === 'delivery_zone'}
            editValue={fieldValue}
            onEditValue={setFieldValue}
            onStartEdit={() => startEdit('delivery_zone', profile.delivery_zone ?? '')}
            onSave={saveField}
            onCancel={cancelEdit}
            saving={saving}
            isSelect
            selectOptions={getDefaultDeliveryZones().map(z => ({ value: z.zone, label: z.name_en }))}
          />
          <ProfileRow
            icon={
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            }
            label={t('address', lang)}
            value={profile.delivery_address ?? '—'}
            editing={editField === 'delivery_address'}
            editValue={fieldValue}
            onEditValue={setFieldValue}
            onStartEdit={() => startEdit('delivery_address', profile.delivery_address ?? '')}
            onSave={saveField}
            onCancel={cancelEdit}
            saving={saving}
          />
        </div>

        {/* Account Type */}
        <AccountTypeCard profile={profile} router={router} />

        {/* Security */}
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden divide-y divide-ink-100 dark:divide-ink-800">
          <SectionRow
            icon={
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
            label={t('changePassword', lang)}
            expanded={changingPassword}
            onToggle={() => setChangingPassword(!changingPassword)}
          >
            <div className="px-4 pb-4 space-y-3">
              <input value={passwordForm.password} onChange={(e) => setPasswordForm(p => ({ ...p, password: e.target.value }))} type="password" placeholder={t('newPassword', lang)} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm" />
              <input value={passwordForm.confirm} onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} type="password" placeholder={t('confirmPassword', lang)} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm" />
              <button onClick={handleChangePassword} disabled={changingPassword} className="btn-primary w-full justify-center py-2.5 text-sm">
                {changingPassword ? t('updatingLabel', lang) : t('updatePassword', lang)}
              </button>
            </div>
          </SectionRow>
          <SectionRow
            icon={
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            }
            label={t('changeEmail', lang)}
            expanded={changingEmail}
            onToggle={() => setChangingEmail(!changingEmail)}
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">{t('currentLabel', lang)} {profile.email}</p>
              <input value={emailValue} onChange={(e) => setEmailValue(e.target.value)} type="email" placeholder="new@example.com" className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm" />
              <button onClick={handleChangeEmail} disabled={changingEmail} className="btn-secondary w-full justify-center py-2.5 text-sm">
                {changingEmail ? t('sendingLabel', lang) : t('sendConfirmation', lang)}
              </button>
            </div>
          </SectionRow>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          {t('logOut', lang)}
        </button>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-ink-900 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
          <button onClick={() => setDeleteOpen(true)} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Delete Account
          </button>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteText('') }} title={t('deleteAccount', lang)} size="sm">
        <p className="text-sm text-muted-foreground mb-4">{t('deleteConfirmDesc', lang)}</p>
        <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="DELETE" className="input mb-4 dark:bg-ink-800 dark:border-ink-700 dark:text-white" />
        <div className="flex gap-3 justify-end">
          <button onClick={() => { setDeleteOpen(false); setDeleteText('') }} className="btn-secondary text-sm">{t('cancel', lang)}</button>
          <button onClick={handleDeleteAccount} disabled={deleteText !== 'DELETE' || deleting} className="btn-danger text-sm">
            {deleting ? t('deletingLabel', lang) : t('deletePermanently', lang)}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AccountTypeCard({ profile, router }: { profile: any; router: any }) {
  const supabase = useMemo(() => createClient(), [])
  const lang = useLangStore((s) => s.lang)
  const [roles, setRoles] = useState<any>({ seller: null, rider: null })
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
    const [sr, rr] = await Promise.all([
      supabase.from('sellers').select('status').eq('user_id', profile.id).maybeSingle(),
      supabase.from('rider_profiles').select('is_verified,account_status').eq('id', profile.id).maybeSingle(),
    ])
    setRoles({ seller: sr.data ?? null, rider: rr.data ?? null })
    setLoading(false)
  }, [supabase, profile.id])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  async function switchRole(role: 'buyer' | 'seller' | 'rider') {
    if (profile.role === role) return
    setSwitching(role)
    const res = await fetch('/api/account/switch-role', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.message || json.error || t('switchFailed', lang)) }
    else { toast.success(t('switchedLabel', lang)); router.refresh() }
    setSwitching(null)
  }

  const roleItems = [
    {
      id: 'buyer',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
      label: t('buyerRole', lang),
      status: 'active',
      statusLabel: t('activeStatus', lang),
      active: profile.role === 'buyer',
      onClick: () => switchRole('buyer'),
    },
    {
      id: 'seller',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>,
      label: t('sellerRole', lang),
      status: roles.seller?.status === 'approved' ? 'approved' : roles.seller?.status === 'pending' ? 'pending' : roles.seller ? 'suspended' : null,
      statusLabel: roles.seller ? t(roles.seller.status, lang) : t('notSetUp', lang),
      active: profile.role === 'seller',
      onClick: () => roles.seller ? switchRole('seller') : router.push('/seller/settings?onboarding=true'),
      disabled: roles.seller?.status === 'suspended',
    },
    {
      id: 'rider',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
      label: t('riderRole', lang),
      status: roles.rider?.is_verified ? 'approved' : roles.rider && roles.rider.account_status !== 'suspended' ? 'pending' : roles.rider?.account_status === 'suspended' ? 'suspended' : null,
      statusLabel: roles.rider ? (roles.rider.is_verified ? t('verified', lang) : t('pending', lang)) : t('notApplied', lang),
      active: profile.role === 'rider',
      onClick: () => roles.rider ? switchRole('rider') : router.push('/rider/apply'),
      disabled: roles.rider?.account_status === 'suspended',
    },
  ]

  if (loading) return null

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden divide-y divide-ink-100 dark:divide-ink-800">
      {roleItems.map(({ id, ...item }) => (
        <RoleRow key={id} {...item} loading={switching === id} />
      ))}
    </div>
  )
}

function RoleRow({ icon, label, status, statusLabel, active, onClick, loading, disabled }: {
  icon: React.ReactNode
  label: string
  status: string | null
  statusLabel: string
  active: boolean
  onClick: () => void
  loading: boolean
  disabled?: boolean
}) {
  const lang = useLangStore((s) => s.lang)
  const statusColor = status === 'active' || status === 'approved' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
    : status === 'pending' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
    : status === 'suspended' ? 'text-red-600 bg-red-50 dark:bg-red-950/30'
    : 'text-muted-foreground bg-muted'

  return (
    <button onClick={onClick} disabled={disabled || loading} className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors text-left ${active ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-brand-500 text-white' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {active && <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/50 px-1.5 py-0.5 rounded-full">{t('activeStatus', lang)}</span>}
        </div>
        <span className={`inline-flex items-center text-[11px] font-medium mt-0.5 px-1.5 py-0.5 rounded-md ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      {!active && (
        <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold whitespace-nowrap">
          {loading ? '...' : status ? t('switchLabel', lang) : t('setUp', lang)}
        </span>
      )}
    </button>
  )
}

