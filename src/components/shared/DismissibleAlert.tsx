'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils'

interface DismissibleAlertProps {
  message?: string
  /** JSX content, used in place of `message` when provided. */
  children?: React.ReactNode
  onDismiss: () => void
  type?: 'error' | 'warning' | 'info' | 'success'
  autoDismissMs?: number
  className?: string
  /** Optional call-to-action rendered next to the message. */
  actionLabel?: string
  action?: () => void
}

export function DismissibleAlert({
  message,
  children,
  onDismiss,
  type = 'error',
  autoDismissMs = 5000,
  className,
  actionLabel,
  action,
}: DismissibleAlertProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      dismiss()
    }, autoDismissMs)

    return () => clearTimeout(timer)
  }, [isVisible, autoDismissMs])

  const dismiss = useCallback(() => {
    if (!isVisible) return
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 200)
  }, [onDismiss])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isVisible) return
    isDraggingRef.current = true
    startXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !isVisible) return
    currentXRef.current = e.touches[0].clientX
    const deltaX = currentXRef.current - startXRef.current

    // Only allow horizontal swipe
    if (Math.abs(deltaX) > Math.abs(e.touches[0].clientY - (e.target as HTMLElement).getBoundingClientRect().top)) {
      e.preventDefault()
      const element = elementRef.current
      if (element) {
        element.style.transform = `translateX(${deltaX}px)`
        element.style.opacity = `${1 - Math.min(Math.abs(deltaX) / 200, 0.5)}`
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isDraggingRef.current || !isVisible) return
    isDraggingRef.current = false

    const element = elementRef.current
    const deltaX = currentXRef.current - startXRef.current

    if (Math.abs(deltaX) > 100) {
      // Swipe threshold met - dismiss
      element!.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
      element!.style.transform = `translateX(${deltaX > 0 ? '100%' : '-100%'})`
      element!.style.opacity = '0'
      setTimeout(() => {
        setIsVisible(false)
        onDismiss()
      }, 300)
    } else {
      // Reset position
      element!.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
      element!.style.transform = 'translateX(0)'
      element!.style.opacity = '1'
    }
  }

  const colors = {
    error: 'bg-red-500/10 border-red-500/30 text-red-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  }

  const icons = {
    error: AlertTriangle,
    warning: AlertTriangle,
    info: AlertTriangle,
    success: AlertTriangle,
  }

  const Icon = icons[type]

  if (!isVisible) return null

  return (
    <div
      ref={elementRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart as any}
      onMouseMove={handleTouchMove as any}
      onMouseUp={handleTouchEnd as any}
      onMouseLeave={handleTouchEnd}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border animate-slide-in',
        isExiting && 'animate-fade-out',
        colors[type],
        'touch-none select-none',
        className
      )}
      style={{ cursor: 'grab' }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">{children || message}</p>
        {actionLabel && action && (
          <button
            onClick={(e) => { e.stopPropagation(); action() }}
            className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {actionLabel}
          </button>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss() }}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/10 transition-colors text-current opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useDismissibleAlert() {
  const [alert, setAlert] = useState<{ message: string; type?: 'error' | 'warning' | 'info' | 'success'; key: number } | null>(null)

  const showAlert = useCallback((message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setAlert({ message, type, key: Date.now() })
  }, [])

  const dismissAlert = useCallback((key: number) => {
    setAlert(prev => prev?.key === key ? null : prev)
  }, [])

  return { alert, showAlert, dismissAlert }
}

