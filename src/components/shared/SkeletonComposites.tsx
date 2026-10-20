import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils'

export { Skeleton }

interface SkeletonTextProps {
  lines?: number
  className?: string
}

/**
 * Shimmering text-block placeholder built on the shadcn Skeleton.
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string
}

/**
 * Card-shaped placeholder (image + lines + action tile) matching ProductCard.
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-3',
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

interface SkeletonGridProps {
  count?: number
  className?: string
}

/**
 * Responsive grid of SkeletonCards for product/search loading states.
 */
export function SkeletonGrid({ count = 8, className }: SkeletonGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

