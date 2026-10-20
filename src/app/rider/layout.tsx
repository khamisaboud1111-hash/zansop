'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, History, Wallet, User, ArrowLeft, Star, ChevronDown, Moon, Sun, Languages, Check, Map, Clock, CreditCard, Settings, ChevronRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageLoader } from '@/components/ui'
import { cn } from '@/utils'
import { useLangStore } from '@/store'
import { t, type Language, type TranslationKey } from '@/i18n/translations'
import { useThemeStore } from '@/store'
import { useState } from 'react'

const NAV: { href: string; labelKey: TranslationKey; icon: React.ElementType; label: string }[] = [
  { href: '/rider/dashboard', labelKey: 'riderDashboard', icon: LayoutDashboard, label: 'Dashibodi' },
  { href: '/rider/available', labelKey: 'availableDeliveries', icon: Package, label: 'Zinapatikana' },
  { href: '/rider/deliveries', labelKey: 'riderDeliveries', icon: History, label: 'Historia' },
  { href: '/rider/wallet', labelKey: 'riderWallet', icon: Wallet, label: 'Pochi' },
  { href: '/rider/profile', labelKey: 'profile', icon: User, label: 'Wasifu' },
]

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ar', label: 'العربية' },
]

function Flag({ code }: { code: Language }) {
  if (code === 'fr')
    return (
      <svg viewBox="0 0 60 40" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
        <rect width="20" height="40" fill="#0055A4" />
        <rect x="20" width="20" height="40" fill="#FFFFFF" />
        <rect x="40" width="20" height="40" fill="#EF4135" />
      </svg>
    )
  if (code === 'sw')
    return (
      <svg viewBox="0 0 60 40" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
        <rect width="60" height="40" fill="#1EB53A" />
        <path fill="#00A3DD" d="M0 40 60 0v40z" />
        <path fill="#FCD116" d="M0 35 60 5v3l-60 30z" />
        <path fill="#FCD116" d="M0 41 60 11v3l-60 30z" />
        <path fill="#000" d="M0 38 60 8v3l-60 30z" />
      </svg>
    )
  if (code === 'ar')
    return (
      <svg viewBox="0 0 60 40" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
        <rect width="60" height="40" fill="#006C35" />
        <g fill="#fff">
          <path d="M20 8 44 32l-6 6L14 14z" />
          <rect x="10" y="4" width="7" height="18" rx="2" />
        </g>
      </svg>
    )
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 30 60 0M0 0 60 30" stroke="#fff" strokeWidth="12" />
      <path d="M0 30 60 0M0 0 60 30" stroke="#C8102E" strokeWidth="8" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  )
}

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, loading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const [langOpen, setLangOpen] = useState(false)

  if (loading) return <PageLoader />

  if (!profile || (profile.role !== 'rider' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-2xl p-8 text-center max-w-sm border border-neutral-800">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="font-semibold text-neutral-200 mb-4">{t('riderOnlyPage', lang)}</p>
          <Link href="/rider/apply" className="bg-white text-black font-semibold px-6 py-3 rounded-full text-sm inline-flex items-center gap-2 hover:bg-neutral-200 transition-colors">
            {t('joinAsRider', lang)}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar — desktop */}
      <aside className="hidden sm:flex flex-col w-64 bg-neutral-950 border-r border-neutral-800 sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 border-b border-neutral-800">
          <Link href="/" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Rudi dukani
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
              {profile.full_name?.charAt(0)?.toUpperCase() ?? 'D'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{profile.full_name ?? 'Dereva'}</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, labelKey, icon: Icon, label }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                pathname.startsWith(href)
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              )}>
              <Icon className="w-5 h-5" />
              <span>{t(labelKey, lang)}</span>
              {pathname.startsWith(href) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all"
              aria-label="Change language"
              aria-haspopup="menu"
              aria-expanded={langOpen}>
              <Languages className="w-5 h-5" />
              <span className="flex-1 text-left">{t('language', lang)}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute left-0 bottom-full mb-2 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all',
                        lang === l.code
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      )}>
                      <Flag code={l.code} />
                      <span className="flex-1 text-left">{l.label}</span>
                      {lang === l.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen pb-20 sm:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-neutral-950 border-t border-neutral-800 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV.map(({ href, labelKey, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all min-w-[56px]',
                pathname.startsWith(href) ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              )}>
              <Icon className="w-5 h-5" />
              <span className="truncate">{t(labelKey, lang)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

