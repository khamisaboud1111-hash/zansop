'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const MIN_PASSWORD_LENGTH = 8

export default function UpdatePasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { lang } = useLangStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(t('passwordMinLength', lang))
      return
    }
    if (password !== confirm) {
      toast.error(t('passwordsDontMatch', lang))
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(t('passwordUpdated', lang))
    setPassword('')
    setConfirm('')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-6 sm:p-8">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-brand-500" />
          </div>
          <h1 className="font-display font-black text-2xl text-ink-900 mb-1">{t('changePassword', lang)}</h1>
          <p className="text-sm text-ink-500">{t('passwordMinLength', lang)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('newPassword', lang)}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          <div>
            <label className="label">{t('confirmPassword', lang)}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? t('updatingLabel', lang) : t('updatePassword', lang)}
          </button>
        </form>
      </div>
    </div>
  )
}

