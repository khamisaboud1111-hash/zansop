'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { SlidersHorizontal, X, Search, TrendingUp, Store, MapPin, Star, Truck, Shield } from 'lucide-react';
import { useSellers } from '@/hooks/useSellers';
import { useLangStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/ui';
import { Skeleton } from '@/components/ui/Card';
import type { Category } from '@/types';
import SellerCard from '@/components/seller/SellerCard';

const POPULAR_SEARCHES = ['Kanga', 'Kikapu', 'Vazi', 'Samani', 'Vifaa vya Nyumbani', 'Electronics', 'Home & Garden', 'Beauty', 'Agriculture']

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('dj_recent_searches') ?? '[]') } catch { return [] }
}

function pushRecent(q: string) {
  if (typeof window === 'undefined' || !q.trim()) return
  const current = getRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())
  localStorage.setItem('dj_recent_searches', JSON.stringify([q, ...current].slice(0, 6)))
}

export default function SellersPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { lang } = useLangStore()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const searchWrapRef = useRef<HTMLDivElement | null>(null)

  const q          = params.get('q') ?? ''
  const category   = params.get('category') ?? ''
  const sort       = (params.get('sort') ?? 'rating') as any
  const page       = Number(params.get('page') ?? '1')

  const { sellers, loading, count, totalPages } = useSellers({ search: q, category, sort, page, pageSize: 12 })

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }: any) => setCategories(data ?? []))
    setRecent(getRecent())
    setInputValue(q)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setSuggestOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.set('page', '1')
    router.push(`/sellers?${p.toString()}`)
  }

  function runSearch(value: string) {
    if (!value.trim()) return
    pushRecent(value.trim())
    setRecent(getRecent())
    setSuggestOpen(false)
    setParam('q', value.trim())
  }

  function clearAll() { router.push('/sellers') }
  function clearRecent() { localStorage.removeItem('dj_recent_searches'); setRecent([]) }

  const hasFilters = !!(q || category)

  return (
    <main className="pb-20 sm:pb-8 dark:bg-ink-950 min-h-screen">
      <div className="page-container py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 dark:text-white mb-2">
            {lang === 'sw' ? 'Wauzaji Wote' : 'All Sellers'}
          </h1>
          <p className="text-ink-500 dark:text-ink-400">
            {lang === 'sw' ? 'Gundua duka bora zaidi na wauzaji wathibitishwaji' : 'Discover the best stores and verified sellers'}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4 relative" ref={searchWrapRef}>
          <form onSubmit={(e) => { e.preventDefault(); runSearch(inputValue) }} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-500 z-10" />
            <input name="q" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onFocus={() => setSuggestOpen(true)} placeholder={lang === 'sw' ? 'Tafuta duka...' : 'Search sellers...'} className="input pl-9 w-full" autoComplete="off" />
            {inputValue && <button type="button" onClick={() => { setInputValue(''); setParam('q', null) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300"><X className="w-4 h-4" /></button>}
          </form>
          <button onClick={() => setFiltersOpen(!filtersOpen)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filtersOpen ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:border-brand-300'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'sw' ? 'Vichujio' : 'Filters'}</span>
          </button>
        </div>

        {hasFilters && <div className="flex flex-wrap gap-2 mb-4"><button onClick={clearAll} className="text-xs text-red-500 dark:text-red-400 font-medium hover:underline px-1">{lang === 'sw' ? 'Futa chujio zote' : 'Clear all filters'}</button></div>}

        {filtersOpen && (
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up">
            <div>
              <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-2">{lang === 'sw' ? 'Aina' : 'Category'}</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => <button key={cat.id} onClick={() => setParam('category', category === cat.slug ? null : cat.slug)} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${category === cat.slug ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300'}`}>{cat.name_sw}</button>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-2">{lang === 'sw' ? 'Panga kwa' : 'Sort by'}</p>
              <div className="flex flex-col gap-1.5">
                {[['rating', lang === 'sw' ? 'Rating: Juu' : 'Rating: High'], ['sales', lang === 'sw' ? 'Mauzo: Zaidi' : 'Most Sales'], ['newest', lang === 'sw' ? 'Mpya zaidi' : 'Newest']].map(([v, label]) => <button key={v} onClick={() => setParam('sort', v)} className={`text-xs text-left px-3 py-1.5 rounded-lg border transition-colors ${sort === v ? 'bg-brand-50 dark:bg-brand-500/15 border-brand-400 text-brand-700 dark:text-brand-300 font-semibold' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300'}`}>{label}</button>)}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ink-500 dark:text-ink-400">{loading ? 'Inapakia...' : `${lang === 'sw' ? 'Wauzaji' : 'Sellers'} ${count.toLocaleString()}`}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SellerCardSkeleton key={i} />)}
          </div>
        ) : sellers.length === 0 ? (
          <EmptyState icon={<Store className="w-10 h-10" />} title={lang === 'sw' ? 'Hakuna wauzaji waliyopatikana' : 'No sellers found'} description={q ? `${lang === 'sw' ? 'Hakuna matokeo kwa' : 'No results for'} "${q}"` : lang === 'sw' ? 'Jaribu kubadilisha vichujio' : 'Try adjusting your filters'} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((s) => <SellerCard key={s.id} seller={s} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setParam('page', String(page - 1))} disabled={page <= 1} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">← {lang === 'sw' ? 'Nyuma' : 'Prev'}</button>
            <span className="text-sm text-ink-600 dark:text-ink-300 px-2">{lang === 'sw' ? 'Ukurasa' : 'Page'} {page} / {totalPages}</span>
            <button onClick={() => setParam('page', String(page + 1))} disabled={page >= totalPages} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">{lang === 'sw' ? 'Mbele' : 'Next'} →</button>
          </div>
        )}
      </div>
    </main>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 rounded-full text-xs font-medium">{label}<button onClick={onRemove} className="hover:text-brand-900 dark:hover:text-brand-100"><X className="w-3 h-3" /></button></span>
}

function SellerCardSkeleton() {
  return (
    <div className="card dark:bg-ink-900 dark:border-ink-800 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

