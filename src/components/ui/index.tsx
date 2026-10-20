import { cn } from '@/utils'
import { Button } from './Button'
import { Input } from './Input'
import { Textarea } from './Input'
import { Select } from './Input'

// Re-export UI primitives
export { Button }
export { Input }
export { Textarea }
export { Select }

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: string; up: boolean }
  accent?: 'brand' | 'spice' | 'green' | 'gold'
  subtitle?: string
}

const accents = {
  brand: 'border-l-brand-500',
  spice: 'border-l-spice-500',
  green: 'border-l-emerald-500',
  gold:  'border-l-amber-500',
}

const iconColors = {
  brand: 'text-brand-600 dark:text-brand-300',
  spice: 'text-spice-600 dark:text-spice-300',
  green: 'text-emerald-600 dark:text-emerald-400',
  gold:  'text-amber-600 dark:text-amber-400',
}

export function StatCard({ label, value, icon, trend, accent = 'brand', subtitle }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card p-4 shadow-card border-l-4',
      accents[accent]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
          <p className="font-display font-black text-2xl text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn('text-xs font-medium mt-1', trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('mt-0.5', iconColors[accent])}>{icon}</div>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="w-8 h-8 border-3 border-ink-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  variant?: 'danger' | 'primary'
}

export function ConfirmDialog({ message, onConfirm, onCancel, loading, variant = 'danger' }: ConfirmDialogProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-700">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm">Ghairi</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={variant === 'danger' ? 'btn-danger text-sm' : 'btn-primary text-sm'}
        >
          {loading ? 'Inafanya...' : 'Thibitisha'}
        </button>
      </div>
    </div>
  )
}

