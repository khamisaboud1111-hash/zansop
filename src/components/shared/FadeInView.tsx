'use client'

import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '@/utils'

/**
 * Reveal-on-scroll elements must never depend on JavaScript to become visible.
 * Rendering `opacity: 0` into the SSR HTML means that if hydration fails for any
 * reason the content stays invisible forever - which is what turned a hydration
 * mismatch into a full-page black screen.
 *
 * So the server and the first client render both emit the VISIBLE state, and the
 * animation is only applied after mount.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

interface FadeInViewProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'none'
}

export function FadeInView({ children, className, delay = 0, direction = 'up' }: FadeInViewProps) {
  const yVal = direction === 'up' ? 24 : direction === 'down' ? -24 : 0
  const mounted = useMounted()

  return (
    <motion.div
      className={cn(className)}
      initial={false}
      animate={mounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      whileInView={mounted ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  // Fallback state used before mount so nothing is ever stuck at opacity 0.
  idle: { opacity: 1, y: 0 },
}

export function StaggerGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  const mounted = useMounted()

  return (
    <motion.div
      className={cn(className)}
      initial={false}
      animate={undefined}
      whileInView={mounted ? 'visible' : undefined}
      variants={gridVariants}
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  const mounted = useMounted()

  return (
    <motion.div
      variants={mounted ? itemVariants : { idle: { opacity: 1, y: 0 } }}
      initial={false}
      animate={mounted ? undefined : { opacity: 1, y: 0 }}
      whileInView={mounted ? undefined : undefined}
    >
      {children}
    </motion.div>
  )
}

