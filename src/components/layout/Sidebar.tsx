'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Package, Heart, User, Store, X, Search, Check, Sun, Moon, Languages, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'
import { useUiStore, useLangStore, useThemeStore } from '@/store'
import { useUser } from '@/hooks/useUser'
import { t, type Language, type TranslationKey } from '@/i18n/translations'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
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

const LINKS: { href: string; icon: any; labelKey: TranslationKey; sellerOnly?: boolean }[] = [
  { href: '/', icon: Home, labelKey: 'home' },
  { href: '/search', icon: LayoutGrid, labelKey: 'browse' },
  { href: '/checkout', icon: ShoppingCart, labelKey: 'cart' },
  { href: '/orders', icon: Package, labelKey: 'orders' },
  { href: '/wishlist', icon: Heart, labelKey: 'wishlist' },
  { href: '/seller/dashboard', icon: Store, labelKey: 'myStore', sellerOnly: true },
  { href: '/settings', icon: User, labelKey: 'account' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const theme = useThemeStore((s) => s.theme)
  const hasHydrated = useThemeStore((s) => s.hasHydrated)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const { isSeller, loading: userLoading } = useUser()
  const [query, setQuery] = useState('')
  const [langOpen, setLangOpen] = useState(false)

  const visibleLinks = LINKS.filter(link => !link.sellerOnly || isSeller)

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
    setQuery('')
  }

  const themeIcon = hasHydrated && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden lg:flex flex-col items-center gap-1 fixed left-0 top-0 bottom-0 w-16 bg-card border-r border-border pt-20 z-30">
        {visibleLinks.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              title={t(link.labelKey, lang)}
              className={cn(
                'relative w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl mx-2 mb-1 transition-all duration-200 group',
                active
                  ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-ink-400 dark:text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-200'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform duration-200', active ? 'scale-110' : 'group-hover:scale-110')} />
              <span className="text-[9px] font-semibold leading-none">{t(link.labelKey, lang)}</span>
            </Link>
          )
        })}

        {/* Language + theme controls pinned to the bottom of the rail */}
        <div className="mt-auto flex flex-col items-center gap-1 pb-4 pt-3 w-full border-t border-ink-100 dark:border-ink-800">
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              title={t('language', lang)}
              aria-label={t('language', lang)}
              className="w-12 h-10 flex items-center justify-center rounded-xl text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"
            >
              <Languages className="w-5 h-5" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute left-12 bottom-0 z-50 bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 rounded-xl shadow-xl p-1.5 min-w-[170px]">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code)
                        setLangOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                        lang === l.code
                          ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold'
                          : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800'
                      )}
                    >
                      <Flag code={l.code} />
                      <span className="flex-1 text-left">{l.label}</span>
                      {lang === l.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={toggleTheme}
            title={t('theme', lang)}
            className="w-12 h-10 flex items-center justify-center rounded-xl text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"
          >
            {themeIcon}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 w-72 max-w-[80vw] z-50 flex flex-col bg-card shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-ink-100 dark:border-ink-800">
                <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  Zanshop
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                  aria-label={t('closeMenu', lang)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={submitSearch} className="px-4 pt-4 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search', lang)}
                  className="w-full bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-500" />
              </form>
              <nav className="flex-1 overflow-y-auto py-3 px-3">
                {visibleLinks.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors',
                        active
                          ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold'
                          : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                      <span className="text-sm font-medium">{t(link.labelKey, lang)}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Theme control only on mobile - language is in top bar */}
              <div className="border-t border-ink-100 dark:border-ink-800 p-4">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
                >
                  {themeIcon}
                  <span>{t('theme', lang)}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

