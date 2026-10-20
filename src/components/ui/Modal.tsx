'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const VARIANTS = {
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  panel: {
    hidden: { opacity: 0, y: 40, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', damping: 28, stiffness: 300 },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.96,
      transition: { duration: 0.15 },
    },
  },
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            variants={VARIANTS.backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />
          <motion.div
            className={cn(
              'relative w-full bg-white dark:bg-ink-900 shadow-modal z-10 sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto',
              widths[size],
            )}
            variants={VARIANTS.panel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {title && (
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-ink-100 dark:border-ink-800 sticky top-0 bg-white dark:bg-ink-900 z-10">
                <h2 className="font-display font-bold text-lg text-ink-900 dark:text-ink-50">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                  aria-label="Funga"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-4 sm:p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

