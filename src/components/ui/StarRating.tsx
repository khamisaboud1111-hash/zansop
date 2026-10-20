'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' }

export function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={cn('transition-transform', !readonly && 'hover:scale-110 cursor-pointer', readonly && 'cursor-default')}
        >
          <Star className={cn(sizes[size], n <= active ? 'fill-amber-400 text-amber-400' : 'text-ink-200')} />
        </button>
      ))}
    </div>
  )
}

