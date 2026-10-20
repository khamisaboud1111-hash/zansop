import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import MobileLanguageSelector from '@/components/layout/MobileLanguageSelector'
import { createServerClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: categories, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) {
    console.error('Failed to load categories:', error.message)
  }

  return (
    <ErrorBoundary>
      <>
        <Navbar categories={categories ?? []} />
        <Sidebar />
        <MobileBottomNav />
        <MobileLanguageSelector />
        <div className="min-h-screen lg:pl-16 pb-16 lg:pb-0">{children}</div>
      </>
    </ErrorBoundary>
  )
}

