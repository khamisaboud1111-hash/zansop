'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

export default function GlobalErrorHandler() {
  const lang = useLangStore((s) => s.lang)

  useEffect(() => {
    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason)
      try {
        sessionStorage.setItem('dj_unhandled_rejection', String(event.reason))
      } catch {
        // best effort
      }
    }

    // Catch unhandled errors.
    // Do NOT call event.preventDefault() here: it suppresses the browser's
    // default error reporting, which is how every render error ended up
    // silently behind a blank page. Log only, never swallow.
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      try {
        const err = event.error || new Error(event.message)
        document.title = 'ERR: ' + (err.name + ': ' + err.message).slice(0, 90)
      } catch {
        // best effort
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}

