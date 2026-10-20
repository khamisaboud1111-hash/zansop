'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 70

export function usePullToRefresh() {
  const router = useRouter()
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const active = useRef(false)
  const pullDistanceRef = useRef(0)
  const routerRef = useRef(router)
  routerRef.current = router

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY
        active.current = true
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && window.scrollY <= 0) {
        setPulling(true)
        const d = Math.min(delta * 0.5, 100)
        pullDistanceRef.current = d
      }
    }

    async function onTouchEnd() {
      if (!active.current) return
      active.current = false
      if (pullDistanceRef.current > THRESHOLD) {
        setRefreshing(true)
        setPullDistance(THRESHOLD)
        await new Promise((r) => setTimeout(r, 600))
        routerRef.current.refresh()
        await new Promise((r) => setTimeout(r, 400))
        setRefreshing(false)
      }
      setPulling(false)
      pullDistanceRef.current = 0
      setPullDistance(0)
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return { pulling, pullDistance, refreshing }
}

