"use client"

import { forwardRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, children, className, disabled, onPointerDown, ...props }, ref) => {
    const [rippling, setRippling] = useState(false)

    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]'

    const variants = {
      primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 hover:shadow-glow-brand focus-visible:ring-brand-500',
      secondary: 'bg-ink-100 text-ink-700 hover:bg-ink-200 active:bg-ink-300 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-700 focus-visible:ring-ink-400',
      outline:   'border-2 border-brand-500 text-brand-600 dark:text-brand-300 dark:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 focus-visible:ring-brand-500',
      danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500',
      ghost:     'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800/60 focus-visible:ring-ink-400',
      glass:     'bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white/20 focus-visible:ring-white/50',
    }

    const sizes = {
      sm: 'text-xs px-3 py-2',
      md: 'text-sm px-4 py-2.5',
      lg: 'text-base px-6 py-3',
    }

    function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
      setRippling(true)
      setTimeout(() => setRippling(false), 500)
      onPointerDown?.(e)
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onPointerDown={handlePointerDown}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          'ripple-surface',
          rippling && 'ripple-active',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

