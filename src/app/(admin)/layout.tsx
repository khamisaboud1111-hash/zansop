'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Store, Package, ShoppingBag, Percent, ArrowLeft, ShieldCheck, Bike, Truck } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageLoader } from '@/components/ui'
import { cn } from '@/utils'

const NAV = [
  { href: '/admin/dashboard',   label: 'Dashibodi',         icon: LayoutDashboard },
  { href: '/admin/sellers',     label: 'Wauuzaji',          icon: Store },
  { href: '/admin/verification',label: 'Uthibitisho',       icon: ShieldCheck },
  { href: '/admin/riders',      label: 'Madereva',          icon: Bike },
  { href: '/admin/deliveries',  label: 'Usafirishaji',      icon: Truck },
  { href: '/admin/products',    label: 'Bidhaa',            icon: Package },
  { href: '/admin/orders',      label: 'Maagizo',           icon: ShoppingBag },
  { href: '/admin/commissions', label: 'Kamisheni',         icon: Percent },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, loading } = useUser()

  if (loading) return <PageLoader />

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <ShieldCheck className="w-10 h-10 text-ink-300 mx-auto mb-4" />
          <p className="font-semibold text-ink-700 mb-2">Huna ruhusa ya kufikia ukurasa huu</p>
          <Link href="/" className="btn-primary inline-flex mt-2">Rudi nyumbani</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 flex">
      <aside className="hidden sm:flex flex-col w-56 bg-ink-900 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-ink-800">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-white mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Rudi dukani
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-spice-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors',
                pathname.startsWith(href) ? 'bg-brand-600 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-900 safe-bottom">
        <div className="flex items-center justify-around h-14">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors',
                pathname.startsWith(href) ? 'text-brand-400' : 'text-ink-400')}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

