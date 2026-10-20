'use client'

import { RefreshCw } from 'lucide-react'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { cn } from '@/utils'

export default function PullToRefreshIndicator() {
  const { pulling, pullDistance, refreshing } = usePullToRefresh()

  if (!pulling && !refreshing) return null

  const progress = Math.min(pullDistance / 70, 1)

  return (
    <div
      className="fixed top-0 inset-x-0 z-[100] flex justify-center pointer-events-none transition-transform"
      style={{ transform: `translateY(${refreshing ? 16 : pullDistance - 40}px)` }}
    >
      <div className="mt-2 w-9 h-9 rounded-full bg-white dark:bg-ink-900 shadow-modal flex items-center justify-center">
        <RefreshCw
          className={cn(
            'w-4 h-4 text-brand-500',
            refreshing && 'animate-spin'
          )}
          style={!refreshing ? { transform: `rotate(${progress * 360}deg)`, opacity: progress } : undefined}
        />
      </div>
    </div>
  )
}

