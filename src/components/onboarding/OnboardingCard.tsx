'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, User, Phone, Eye, EyeOff, Loader2,
  ShoppingBag, Store, Bike, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import toast from 'react-hot-toast'
import { cn } from '@/utils'

export type OnboardingMode = 'signup' | 'signin'
export type AccountRole = 'buyer' | 'seller' | 'rider' | 'admin'
type SignupRole = 'buyer' | 'seller' | 'rider'

const ROUTES: Record<AccountRole, string> = {
  buyer: '/',
  seller: '/seller/dashboard',
  rider: '/rider/dashboard',
  admin: '/admin/dashboard',
} as const

/* ── Validation schemas (mirror the originals in the old auth pages) ─── */

function makeSignInSchema(lang: Language) {
  return z.object({
    email: z.string().trim().email(t('invalidEmail', lang)),
    password: z.string().min(6, t('passwordMinLength', lang)),
  })
}
type SignInData = z.infer<ReturnType<typeof makeSignInSchema>>

function makeSignUpSchema(lang: Language) {
  return z.object({
    full_name: z.string().min(2, t('nameRequired', lang)),
    email: z.string().email(t('invalidEmail', lang)),
    phone: z.string().min(10, t('phoneRequired', lang)),
    password: z.string().min(8, t('passwordMinLength', lang)),
    type: z.enum(['buyer', 'seller', 'rider']),
  })
}
type SignUpData = z.infer<ReturnType<typeof makeSignUpSchema>>

const ROLES: {
  id: SignupRole
  labelKey: 'buyerRole' | 'sellerRole' | 'rider'
  taglineKey: 'roleBuyerTagline' | 'roleSellerTagline' | 'roleRiderTagline'
  icon: typeof ShoppingBag
}[] = [
  { id: 'buyer', labelKey: 'buyerRole', taglineKey: 'roleBuyerTagline', icon: ShoppingBag },
  { id: 'seller', labelKey: 'sellerRole', taglineKey: 'roleSellerTagline', icon: Store },
  { id: 'rider', labelKey: 'rider', taglineKey: 'roleRiderTagline', icon: Bike },
]

/* ── Glass field + button styles ─────────────────────────────────────── */

const glassInput =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 pl-9 pr-10 text-sm text-white ' +
  'placeholder:text-white/40 transition-colors duration-150 ' +
  'focus:border-teal-300/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-teal-300/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

function GlassField({ label, labelTrailing, icon, error, trailing, children }: {
  label: string
  labelTrailing?: React.ReactNode
  icon: React.ReactNode
  error?: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-white/80">{label}</label>
        {labelTrailing}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-200/70">{icon}</span>
        {children}
        {trailing && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-rose-200" role="alert">{error}</p>}
    </div>
  )
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

function GlassSubmit({ loading, disabled, children }: {
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-glow-brand transition-all hover:brightness-110 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

/* ── Sign In form ────────────────────────────────────────────────────── */

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter()
  const { lang } = useLangStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockout, setLockout] = useState(0)

  const { register, handleSubmit, formState: { errors } } = useForm<SignInData>({
    resolver: zodResolver(makeSignInSchema(lang)),
  })

  useEffect(() => {
    if (lockout <= 0) return
    const id = setInterval(() => setLockout((v) => v - 1), 1000)
    return () => clearInterval(id)
  }, [lockout])

  async function onSubmit({ email, password }: SignInData) {
    if (loading || lockout > 0) return

    if (attempts >= 5) {
      setLockout(30)
      setAttempts(0)
      toast.error(t('tooManyAttempts', lang).replace('{seconds}', '30'))
      return
    }

    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      const supabase = createClient()
      const normalizedEmail = email.trim().toLowerCase()

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (authError) {
        setAttempts((prev) => prev + 1)
        if (authError.message.includes('Invalid') || authError.status === 400) {
          toast.error('Barua pepe au nywila si sahihi')
        } else if (authError.message.includes('confirmed')) {
          toast.error(t('pleaseVerifyEmail', lang))
        } else {
          toast.error('Imeshindikana kuingia. Angalia mtandao wako.')
        }
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        toast.error('Hitilafu imetokea wakati wa kuthibitisha mtumiaji.')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', userData.user.id)
        .single()

      if (profileError || !profile) {
        toast.error(t('profileUpdateFailed', lang))
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (!(profile.role in ROUTES)) {
        toast.error(t('unrecognizedRole', lang))
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success(t('loggedInSuccessfully', lang))

      // NOTE: The ?redirect= param is lost if the user navigates away from the
      // onboarding shell (e.g. to email confirmation) and returns. This is a known
      // limitation of the current auth flow — the redirect is only preserved within
      // a single page load.
      const redirectPath = new URLSearchParams(window.location.search).get('redirect') ?? ''
      const destination =
        redirectPath && redirectPath.startsWith('/')
          ? redirectPath
          : ROUTES[profile.role as AccountRole] ?? '/'

      setTimeout(() => router.replace(destination), 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <GlassField label={t('email', lang)} icon={<Mail className="h-4 w-4" />} error={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          inputMode="email"
          autoComplete="username"
          disabled={loading || lockout > 0}
          autoFocus
          placeholder={t('emailPlaceholder', lang)}
          aria-invalid={!!errors.email}
          className={cn(glassInput, errors.email && 'border-rose-300/70')}
        />
      </GlassField>

      <GlassField
        label={t('password', lang)}
        icon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        labelTrailing={
          <Link href="/forgot-password" className="text-xs font-medium text-teal-200/90 hover:text-white">
            {t('forgotPassword', lang)}
          </Link>
        }
        trailing={<PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
      >
        <input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          disabled={loading || lockout > 0}
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          className={cn(glassInput, errors.password && 'border-rose-300/70')}
        />
      </GlassField>

      <GlassSubmit loading={loading || success} disabled={lockout > 0}>
        {success
          ? t('loggedInSuccessfully', lang)
          : lockout > 0
            ? t('pleaseWait', lang).replace('{seconds}', String(lockout))
            : loading
              ? t('loggingIn', lang)
              : t('signInWith', lang)}
      </GlassSubmit>

      <p className="text-center text-sm text-white/70">
        {t('noAccount', lang)}{' '}
        <button type="button" onClick={onSwitch} className="font-semibold text-teal-200 hover:text-white">
          {t('createAccount', lang)}
        </button>
      </p>
    </form>
  )
}

/* ── Sign Up form — single card, role as segmented control ───────────── */

function SignUpForm({ onSwitch, initialType }: { onSwitch: () => void; initialType?: SignupRole }) {
  const router = useRouter()
  const { lang } = useLangStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignUpData>({
    resolver: zodResolver(makeSignUpSchema(lang)),
    defaultValues: { type: initialType ?? 'buyer' },
  })

  const accountType = watch('type')
  const activeRole = ROLES.find((r) => r.id === accountType)!

  async function onSubmit(data: SignUpData) {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name, phone: data.phone, role: data.type },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        },
      })

      if (error) {
        toast.error(error.message === 'User already registered' ? t('emailAlreadyRegistered', lang) : error.message)
        setLoading(false)
        return
      }
      if (!authData.user) {
        toast.error(t('accountCreateFailed', lang))
        setLoading(false)
        return
      }

      // No session → email confirmation still on; send the user to sign in.
      if (!authData.session) {
        toast.success(t('accountCreatedVerifyEmail', lang))
        setLoading(false)
        onSwitch()
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name, phone: data.phone, role: data.type })
        .eq('id', authData.user.id)

      if (profileError) {
        toast.error(t('profileUpdateFailed', lang))
        router.push('/')
        router.refresh()
        setLoading(false)
        return
      }

      toast.success(t('welcome', lang))
      if (data.type === 'seller') router.push('/seller/settings?onboarding=true')
      else if (data.type === 'rider') router.push('/rider/apply')
      else router.push('/')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('type')} />

      {/* Role segmented control */}
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((role) => {
          const Icon = role.icon
          const selected = accountType === role.id
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setValue('type', role.id)}
              aria-pressed={selected}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all active:scale-[0.98]',
                selected
                  ? 'border-white/50 bg-white/20 text-white shadow-lg'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white',
              )}
            >
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', selected ? 'bg-white/90 text-teal-700' : 'bg-white/10')}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold">{t(role.labelKey, lang)}</span>
              {selected && <Check className="h-3.5 w-3.5 text-teal-200" strokeWidth={3} />}
            </button>
          )
        })}
      </div>
      <p className="min-h-[1.25rem] text-center text-[11px] text-white/60">{t(activeRole.taglineKey, lang)}</p>

      <GlassField label={t('fullName', lang)} icon={<User className="h-4 w-4" />} error={errors.full_name?.message}>
        <input
          {...register('full_name')}
          autoComplete="name"
          placeholder={t('fullNamePlaceholder', lang)}
          disabled={loading}
          aria-invalid={!!errors.full_name}
          className={cn(glassInput, errors.full_name && 'border-rose-300/70')}
        />
      </GlassField>

      <GlassField label={t('email', lang)} icon={<Mail className="h-4 w-4" />} error={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder', lang)}
          disabled={loading}
          aria-invalid={!!errors.email}
          className={cn(glassInput, errors.email && 'border-rose-300/70')}
        />
      </GlassField>

      <GlassField label={t('phone', lang)} icon={<Phone className="h-4 w-4" />} error={errors.phone?.message}>
        <input
          {...register('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="255777000000"
          disabled={loading}
          aria-invalid={!!errors.phone}
          className={cn(glassInput, errors.phone && 'border-rose-300/70')}
        />
      </GlassField>

      <GlassField
        label={t('password', lang)}
        icon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        trailing={<PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
      >
        <input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={t('min8Chars', lang)}
          disabled={loading}
          aria-invalid={!!errors.password}
          className={cn(glassInput, errors.password && 'border-rose-300/70')}
        />
      </GlassField>

      <GlassSubmit loading={loading}>{loading ? t('creatingAccount', lang) : t('createAccount', lang)}</GlassSubmit>

      <p className="text-center text-sm text-white/70">
        {t('haveAccount', lang)}{' '}
        <button type="button" onClick={onSwitch} className="font-semibold text-teal-200 hover:text-white">
          {t('loginHere', lang)}
        </button>
      </p>
    </form>
  )
}

/* ── Glass card with Sign Up / Sign In toggle ────────────────────────── */
// NOTE: This file is ~535 lines but tightly coupled — SignInForm, SignUpForm, and
// shared glass-field components all share state patterns and the same visual language.
// Extracting them would add import overhead without meaningful decoupling.
// Consider splitting only if a third distinct mode or form variant is added.

interface Props {
  initialMode?: OnboardingMode
  initialType?: SignupRole
}

const formVariants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
}

export default function OnboardingCard({ initialMode = 'signup', initialType }: Props) {
  const { lang } = useLangStore()
  const [mode, setMode] = useState<OnboardingMode>(initialMode)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
      className="w-full max-w-md"
    >
      <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-glass backdrop-blur-glass sm:p-8">
        {/* Tab toggle */}
        <div className="mb-7 grid grid-cols-2 rounded-2xl border border-white/15 bg-white/10 p-1">
          {(['signup', 'signin'] as const).map((m) => {
            const active = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active}
                className={cn(
                  'relative rounded-xl py-2.5 text-sm font-bold transition-colors',
                  active ? 'text-teal-950' : 'text-white/70 hover:text-white',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="onboarding-pill"
                    className="absolute inset-0 rounded-xl bg-white/95 shadow-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{m === 'signup' ? t('createAccount', lang) : t('signInWith', lang)}</span>
              </button>
            )
          })}
        </div>

        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
            {mode === 'signup' ? t('startBuyingSellingToday', lang) : t('welcomeBack', lang)}
          </h1>
          <p className="mt-1 text-sm text-white/65">
            {mode === 'signup' ? t('joinThousands', lang) : t('loginSubtitle', lang)}
          </p>
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {mode === 'signup' ? (
                <SignUpForm onSwitch={() => setMode('signin')} initialType={initialType} />
              ) : (
                <SignInForm onSwitch={() => setMode('signup')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

