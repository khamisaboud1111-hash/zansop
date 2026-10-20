'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchX, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-ink-50 dark:from-ink-950 dark:to-ink-900">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="font-display font-black text-6xl text-foreground mb-2">404</h1>
        <p className="text-lg font-semibold text-foreground mb-2">Ukurasa haupatikani</p>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
          Samahani, ukurasa unaoutafuta haupo au umehamishwa. Angalia URL au rudi nyumbani.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" /> Rudi Nyumbani
          </Link>
          <button onClick={() => router.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Rudi Nyuma
          </button>
        </div>
      </div>
    </div>
  )
}

