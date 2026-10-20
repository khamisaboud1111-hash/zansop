'use client'

import { useState } from 'react'
import { Languages, Check } from 'lucide-react'
import { cn } from '@/utils'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'

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

const currentLabel = (code: Language) => LANGUAGES.find((l) => l.code === code)?.label ?? code

export default function LanguageSwitcher({ variant = 'pill' }: { variant?: 'pill' | 'icon' }) {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('language', lang)}
        aria-label={t('language', lang)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2.5 rounded-xl font-semibold shadow-sm transition-colors',
          variant === 'pill'
            ? 'px-3.5 py-2.5 bg-brand-500 text-white border border-brand-600 hover:bg-brand-600'
            : 'w-12 h-10 justify-center text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
        )}
      >
        <Languages className="w-4 h-4 shrink-0" />
        {variant === 'pill' && (
          <span className="text-sm font-semibold flex items-center gap-1.5">
            <Flag code={lang} />
            <span className="hidden sm:inline">{currentLabel(lang)}</span>
            <span className="sm:hidden uppercase">{lang}</span>
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 rounded-xl shadow-xl p-1.5 min-w-[170px]">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  lang === l.code
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 font-semibold'
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
  )
}

