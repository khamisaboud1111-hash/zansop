'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-ink-50 dark:from-ink-950 dark:to-ink-900">
      <div className="w-full max-w-md">
        <ErrorState
          title="Hitilafu ya admin dashboard"
          description="Samahani, hitilafu imetokea wakati wa kupakia dashboard ya admin."
          retryLabel="Jaribu tena"
          onRetry={reset}
        />
        {error.digest && (
          <p className="text-center text-xs text-ink-400 dark:text-ink-500 mt-4 font-mono">
            Kosa ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}

