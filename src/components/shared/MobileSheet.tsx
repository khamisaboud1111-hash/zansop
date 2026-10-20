'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/utils'

type SheetSide = 'left' | 'right' | 'bottom' | 'top'

interface MobileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  side?: SheetSide
  children: React.ReactNode
  className?: string
}

/**
 * Mobile-first sheet/drawer built on shadcn Sheet — safe-area aware,
 * scrollable, capped height for bottom sheets. Uses shadcn SheetContent
 * (which ships a close button and backdrop).
 */
export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  side = 'bottom',
  children,
  className,
}: MobileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'flex flex-col gap-4 overflow-y-auto pb-[env(safe-area-inset-bottom)]',
          side === 'bottom' && 'max-h-[85dvh]',
          (side === 'left' || side === 'right') && 'sm:max-w-sm',
          className
        )}
      >
        {(title || description) && (
          <SheetHeader className="text-left">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        {children}
      </SheetContent>
    </Sheet>
  )
}

