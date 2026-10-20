'use client'

import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  itemKey: (item: T) => string
  overscan?: number
  className?: string
  loading?: boolean
  emptyMessage?: string
  onEndReached?: () => void
  onEndReachedThreshold?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  itemKey,
  overscan = 5,
  className,
  loading = false,
  emptyMessage = 'Hakuna data',
  onEndReached,
  onEndReachedThreshold = 0.8,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 })

  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const totalHeight = items.length * itemHeight

  // Calculate visible range based on scroll position
  const calculateVisibleRange = useCallback((scrollY: number) => {
    const start = Math.max(0, Math.floor(scrollY / itemHeight) - overscan)
    const end = Math.min(items.length, start + visibleCount + overscan * 2)
    return { start, end }
  }, [itemHeight, overscan, items.length])

  useEffect(() => {
    const range = calculateVisibleRange(scrollTop)
    setVisibleRange(range)
  }, [scrollTop, calculateVisibleRange])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollY = e.currentTarget.scrollTop
    setScrollTop(scrollY)

    // Check if we've reached the end
    if (onEndReached && e.currentTarget.scrollHeight - scrollTop - containerHeight < containerHeight * onEndReachedThreshold) {
      onEndReached()
    }
  }, [onEndReached, onEndReachedThreshold, containerHeight])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      key: itemKey(item),
    }))
  }, [items, visibleRange, itemKey])

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)} style={{ height: containerHeight }}>
        <div className="text-center text-ink-500 dark:text-ink-400 py-12">
          <p>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.start * itemHeight}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems.map(({ item, index, key }) => (
            <div key={key} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
      {loading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Inapakia zaidi...</span>
        </div>
      )}
    </div>
  )
}

// Auto-height VirtualList that calculates container height automatically
export function AutoVirtualList<T>({
  items,
  itemHeight,
  renderItem,
  itemKey,
  overscan = 5,
  className,
  loading = false,
  emptyMessage = 'Hakuna data',
  onEndReached,
  onEndReachedThreshold = 0.8,
  maxHeight = '100vh',
}: Omit<VirtualListProps<T>, 'containerHeight'> & { maxHeight?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerHeight(rect.height)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  return (
    <div ref={containerRef} className={className} style={{ maxHeight, overflow: 'hidden' }}>
      <VirtualList
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        itemKey={itemKey}
        overscan={overscan}
        loading={loading}
        emptyMessage={emptyMessage}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
      />
    </div>
  )
}

// Hook for manual virtual scrolling control
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleCount = Math.ceil(containerHeight / itemHeight)

  const { start, end } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(items.length, start + visibleCount + overscan * 2)
    return { start, end }
  }, [scrollTop, itemHeight, overscan, items.length, visibleCount, containerHeight])

  const visibleItems = useMemo(
    () => items.slice(start, end),
    [items, start, end]
  )

  const totalHeight = items.length * itemHeight
  const offsetY = start * itemHeight

  const scrollTo = useCallback((index: number) => {
    setScrollTop(index * itemHeight)
  }, [itemHeight])

  const scrollToItem = useCallback((item: T, getKey: (item: T) => string) => {
    const index = items.findIndex((i) => getKey(i) === getKey(item))
    if (index !== -1) {
      scrollTo(index)
    }
  }, [items, scrollTo])

  return {
    scrollTop,
    setScrollTop,
    visibleItems,
    startIndex: start,
    endIndex: end,
    totalHeight,
    offsetY,
    scrollTo,
    scrollToItem,
  }
}

