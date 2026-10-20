'use client'

import { Profile, Category } from '@/types'
import Link from 'next/link'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  profile: Profile | null
  categories?: Category[]
}

export default function MobileDrawer({ open, onClose, profile, categories = [] }: MobileDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-80 bg-white dark:bg-ink-900 h-full shadow-xl p-4">
        {/* Your Drawer links and content go here */}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

