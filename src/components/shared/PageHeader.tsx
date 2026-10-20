import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/utils'

interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  backHref?: string
  onBack?: () => void
  backLabel?: React.ReactNode
  className?: string
}

/**
 * Consistent page header — title, optional subtitle, optional action row,
 * optional back link (either a router link or a callback).
 * Pure presentational; callers own i18n.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  onBack,
  backLabel,
  className,
}: PageHeaderProps) {
  const backLink = backHref ? (
    <Link
      href={backHref}
      aria-label={backLabel ? undefined : 'Back'}
      className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {backLabel}
    </Link>
  ) : onBack ? (
    <button
      type="button"
      onClick={onBack}
      aria-label={backLabel ? undefined : 'Back'}
      className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {backLabel}
    </button>
  ) : null

  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {backLink && <div className="mb-2">{backLink}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  )
}

