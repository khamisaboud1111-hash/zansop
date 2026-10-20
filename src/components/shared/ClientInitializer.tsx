'use client'

import { useEffect } from 'react'
import { useStores } from '@/store'
import type { Language, Theme } from '@/store'

// ─── Early error capture (runs at module import, before React hydrates) ──────
//
// React unmounting the whole root (or a hydration recovery switch) wipes the
// document, including <head>, so anything an in-tree component logs afterwards
// is gone. Module-level listeners fire before hydration starts, record the
// first error into a fixed location, and a tiny self-healing loop re-injects a
// banner into <body> as long as the page stays empty - so a fatal error can
// never be invisible again.

declare global {
  interface Window { __djLastErr?: string }
}

if (typeof window !== 'undefined') {
  const baseTitle = document.title

  window.__djLastErr = undefined

  const record = (name: string, message: string, stack?: string) => {
    const first = (stack || '').split('\n')[0]
    const info = (name ? name + ': ' : '') + message + (first ? ' › ' + first : '')
    window.__djLastErr = 'ERR: ' + info.slice(0, 220)
    try { document.title = window.__djLastErr } catch { /* noop */ }
    try {
      sessionStorage.setItem(
        'dj_last_error',
        JSON.stringify({ name, message, stack: (stack || '').slice(0, 1200), ts: Date.now() })
      )
    } catch { /* noop */ }
  }

  window.addEventListener('error', (e) => {
    if (e.error) record(e.error.name || 'Error', e.error.message || e.message, e.error.stack)
    else record('Error', e.message)
  })

  window.addEventListener('unhandledrejection', (e) => {
    const r = (e as PromiseRejectionEvent).reason
    if (r instanceof Error) record(r.name, r.message, r.stack)
    else record('Rejection', String(r))
  })

  // Content detector: is the page actually showing anything?
  const hasContent = () => {
    const b = document.body
    if (!b) return false
    for (const child of Array.from(b.children)) {
      if (child.tagName === 'SCRIPT' || child.id === 'dj-fatal') continue
      if (child.childElementCount > 0 || child.textContent) return true
    }
    return false
  }

  // Self-healing watchdog: while an error happened AND the page is visibly
  // empty, keep a banner alive even if React wipes/rebuilds the document.
  setInterval(() => {
    try {
      const saved = window.__djLastErr
      const el = document.getElementById('dj-fatal')
      if (saved && !hasContent()) {
        if (!el) {
          const d = document.createElement('div')
          d.id = 'dj-fatal'
          d.style.cssText =
            'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#7f1d1d;' +
            'color:#fff;font:12px/1.5 monospace;padding:10px 14px;white-space:pre-wrap;max-height:40%;overflow:auto'
          d.textContent = saved
          if (document.body) document.body.appendChild(d)
        }
      } else if (el) {
        el.remove()
      }
      // Recovered page: clear transient global state so normal operation looks normal.
      if (saved && hasContent()) {
        window.__djLastErr = undefined
        try { document.title = baseTitle } catch { /* noop */ }
      }
    } catch { /* noop */ }
  }, 400)
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
  return cookie?.split('=')[1]
}

function applyDir(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

export function ClientInitializer() {
  const langStore = useStores().useLangStore
  const themeStore = useStores().useThemeStore

  // Sync from cookies after hydration
  useEffect(() => {
    const langCookie = readCookie('lang')
    const themeCookie = readCookie('theme')
    const lang: Language = (langCookie === 'ar' || langCookie === 'en' || langCookie === 'fr') ? langCookie : 'sw'
    const theme: Theme = themeCookie === 'dark' ? 'dark' : 'light'
    applyDir(lang)
    applyTheme(theme)
    langStore.getState().setLang(lang)
    themeStore.getState().setTheme(theme)
  }, [langStore, themeStore])

  return null
}

