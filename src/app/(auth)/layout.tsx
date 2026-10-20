'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import { useThemeStore } from '@/store'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, hasHydrated, setTheme } = useThemeStore()

  // Force dark mode when arriving at auth pages
  const prevRef = useRef(theme)
  useEffect(() => {
    if (!hasHydrated) return
    prevRef.current = theme
    setTheme('dark')
    return () => { setTheme(prevRef.current) }
  }, [hasHydrated, setTheme])

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 flex flex-col">
      <header className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">DJ</span>
            </div>
            <span className="font-display font-black text-brand-300 text-xl">Zanshop</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-400 hover:bg-ink-800 hover:text-ink-200 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="p-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Zanshop · Zanzibar, Tanzania
      </footer>
    </div>
  )
}


