'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Package, User } from 'lucide-react'
import { cn } from '@/utils'
import { useLangStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'

const LINKS: { href: string; icon: any; labelKey: TranslationKey }[] = [
  { href: '/', icon: Home, labelKey: 'home' },
  { href: '/search', icon: LayoutGrid, labelKey: 'browse' },
  { href: '/checkout', icon: ShoppingCart, labelKey: 'cart' },
  { href: '/orders', icon: Package, labelKey: 'orders' },
  { href: '/settings', icon: User, labelKey: 'account' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const lang = useLangStore((s) => s.lang)

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-14">
        {LINKS.map((link) => {
          const Icon = link.icon
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full transition-colors',
                active ? 'text-brand-600 dark:text-brand-300' : 'text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />
              <span className="text-[10px] font-semibold leading-none">{t(link.labelKey, lang)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

