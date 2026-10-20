'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Lock, ShoppingBag, Store, Bike, Check, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import toast from 'react-hot-toast'
import { cn } from '@/utils'

type Step = 1 | 2 | 3
type Role = 'buyer' | 'seller' | 'rider'

const ROLES = [
  { id: 'buyer' as Role, swLabel: 'Mnunuzi', enLabel: 'Buyer', icon: ShoppingBag, swDesc: 'Nunua bidhaa', enDesc: 'Shop products' },
  { id: 'seller' as Role, swLabel: 'Muuzaji', enLabel: 'Seller', icon: Store, swDesc: 'Uza bidhaa zako', enDesc: 'Sell your products' },
  { id: 'rider' as Role, swLabel: 'Dereva', enLabel: 'Rider', icon: Bike, swDesc: 'Safirisha maagizo', enDesc: 'Deliver orders' },
]

export function SimplifiedOnboarding() {
  const router = useRouter()
  const { lang } = useLangStore()
  const isSw = lang === 'sw'
  const [step, setStep] = useState<Step>(1)
  const [role, setRole] = useState<Role>('buyer')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const canNext1 = !!role
  const canNext2 = fullName.trim().length >= 2 && phone.trim().length >= 10 && email.includes('@')
  const canSubmit = password.length >= 8

  async function handleSubmit() {
    if (!canSubmit) {
      toast.error(isSw ? 'Nywila ni fupi (herufi 8+)' : 'Password too short (8+ chars)')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim(), phone: phone.trim(), role },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        },
      })
      if (error) {
        toast.error(error.message === 'User already registered' ? t('emailAlreadyRegistered', lang) : error.message)
        setLoading(false)
        return
      }
      if (!data.session) {
        toast.success(t('accountCreatedVerifyEmail', lang))
        router.push('/onboarding?mode=signin')
        return
      }
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim(), role })
        .eq('id', data.user!.id)
      if (profileError) toast.error(t('profileUpdateFailed', lang))
      else toast.success(t('welcome', lang))
      if (role === 'seller') router.push('/seller/settings?onboarding=true')
      else if (role === 'rider') router.push('/rider/apply')
      else router.push('/')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Network error')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress dots - large touch-friendly */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all',
                step === s
                  ? 'bg-white text-teal-900 border-white shadow-lg scale-110'
                  : step > s
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white/10 text-white/60 border-white/20'
              )}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && <div className={cn('w-8 h-0.5', step > s ? 'bg-emerald-400' : 'bg-white/20')} />}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-white/60 mb-6 tracking-wide uppercase">
        {isSw ? `Hatua ${step} ya 3` : `Step ${step} of 3`}
      </p>

      <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-glass p-6 shadow-glass">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display font-bold text-xl text-white text-center">
                {isSw ? 'Wewe ni nani?' : 'Who are you?'}
              </h2>
              <p className="text-sm text-white/60 text-center">{isSw ? 'Chagua aina ya akaunti' : 'Choose account type'}</p>
              <div className="grid gap-3 pt-2">
                {ROLES.map((r) => {
                  const Icon = r.icon
                  const selected = role === r.id
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all min-h-[64px]',
                        selected ? 'bg-white text-teal-900 border-white shadow-lg' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      )}
                    >
                      <span className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', selected ? 'bg-teal-100 text-teal-700' : 'bg-white/10')}>
                        <Icon className="w-6 h-6" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-base">{isSw ? r.swLabel : r.enLabel}</span>
                        <span className={cn('text-xs', selected ? 'text-teal-700/70' : 'text-white/60')}>{isSw ? r.swDesc : r.enDesc}</span>
                      </span>
                      {selected && <Check className="w-5 h-5 text-teal-600" />}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!canNext1}
                className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold shadow-glow-brand disabled:opacity-50 min-h-[48px]"
              >
                {isSw ? 'Endelea' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display font-bold text-xl text-white text-center">{isSw ? 'Taarifa zako' : 'Your details'}</h2>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-white/80 mb-1.5 block">{isSw ? 'Jina kamili' : 'Full name'}</span>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={isSw ? 'Juma Hassan' : 'John Doe'} className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-teal-300 min-h-[48px]" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-white/80 mb-1.5 block">{isSw ? 'Namba ya simu' : 'Phone'}</span>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="255777000000" className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-teal-300 min-h-[48px]" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-white/80 mb-1.5 block">Email</span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" placeholder="you@example.com" className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-teal-300 min-h-[48px]" />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold min-h-[48px]">
                  <ArrowLeft className="w-4 h-4" /> {isSw ? 'Rudi' : 'Back'}
                </button>
                <button onClick={() => setStep(3)} disabled={!canNext2} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold disabled:opacity-50 min-h-[48px]">
                  {isSw ? 'Endelea' : 'Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="font-display font-bold text-xl text-white text-center">{isSw ? 'Weka nywila' : 'Set password'}</h2>
              <p className="text-sm text-white/60 text-center">{isSw ? 'Herufi 8 au zaidi' : 'At least 8 characters'}</p>
              <label className="block">
                <span className="text-xs font-semibold text-white/80 mb-1.5 block">{isSw ? 'Nywila' : 'Password'}</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} placeholder="••••••••" className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-teal-300 min-h-[48px]" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
              <div className="bg-white/5 rounded-xl p-3 text-xs text-white/60">
                {isSw ? 'Kwa kuchagua "Fungua akaunti" unakubali Masharti yetu.' : 'By creating an account you agree to our Terms.'}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold min-h-[48px]">
                  <ArrowLeft className="w-4 h-4" /> {isSw ? 'Rudi' : 'Back'}
                </button>
                <button onClick={handleSubmit} disabled={!canSubmit || loading} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold disabled:opacity-50 min-h-[48px]">
                  {loading ? (isSw ? 'Inafungua...' : 'Creating...') : (isSw ? 'Fungua akaunti' : 'Create account')}
                  {!loading && <Check className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-center text-xs text-white/50 mt-4">
        {isSw ? 'Tayari una akaunti?' : 'Already have an account?'}{' '}
        <a href="/onboarding?mode=signin" className="text-teal-200 underline">
          {isSw ? 'Ingia hapa' : 'Sign in'}
        </a>
      </p>
    </div>
  )
}

