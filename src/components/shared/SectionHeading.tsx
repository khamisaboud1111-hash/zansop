import { cn } from '@/utils'

interface SectionHeadingProps {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}

/**
 * Consistent section header — title, optional description, optional action
 * (e.g. a "View all →" link). Pure presentational; callers own i18n.
 */
export function SectionHeading({
  title,
  description,
  action,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className
      )}
    >
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

