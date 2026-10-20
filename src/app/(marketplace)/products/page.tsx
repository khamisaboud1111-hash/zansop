'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { SlidersHorizontal, X, Search, TrendingUp, Shield, Award, Clock } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useLangStore } from '@/store';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/ui';
import { Skeleton } from '@/components/ui/Card';
import type { Category } from '@/types';
import { VoiceSearchInline } from '@/components/search/VoiceSearchButton';
import { t, type Language } from '@/i18n/translations';

const POPULAR_SEARCHES = ['Karafuu', 'Kanga', 'Mafuta ya Nazi', 'Vazi la Kiislamu', 'Vikapu vya Ukili']

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('dj_recent_searches') ?? '[]')
  } catch {
    return []
  }
}

function pushRecent(q: string) {
  if (typeof window === 'undefined' || !q.trim()) return
  const current = getRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())
  const updated = [q, ...current].slice(0, 6)
  localStorage.setItem('dj_recent_searches', JSON.stringify(updated))
}

export default function ProductsPage() {
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
  const sort       = (params.get('sort') ?? 'newest') as any
  const madeInZnz  = params.get('made_in_zanzibar') === 'true'
  const page       = Number(params.get('page') ?? '1')

  const { products, loading, count, totalPages, error } = useMarketplaceProducts({
    search: q, category, sort, madeInZanzibar: madeInZnz, page, pageSize: 24,
  })

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }: any) => setCategories(data ?? []))
    setRecent(getRecent())
    setInputValue(q)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.set('page', '1')
    router.push(`/products?${p.toString()}`)
  }

  function runSearch(value: string) {
    if (!value.trim()) return
    pushRecent(value.trim())
    setRecent(getRecent())
    setSuggestOpen(false)
    setParam('q', value.trim())
  }

  function clearAll() {
    router.push('/products')
  }

  function clearRecent() {
    localStorage.removeItem('dj_recent_searches')
    setRecent([])
  }

  const hasFilters = !!(q || category || madeInZnz || sort !== 'newest')

  function sortLabel(sort: string, lang: Language) {
    const map: Record<string, string> = {
      price_asc: t('sortPriceAsc', lang),
      price_desc: t('sortPriceDesc', lang),
      popular: t('sortPopular', lang),
    }
    return map[sort] ?? sort
  }

  return (
    <main className="pb-20 sm:pb-8 dark:bg-ink-950 min-h-screen">
      <div className="page-container py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 dark:text-white mb-2">
            {t('allProducts', lang)}
          </h1>
          <p className="text-ink-500 dark:text-ink-400">
            {t('allProductsDesc', lang)}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4 relative" ref={searchWrapRef}>
          <form onSubmit={(e) => { e.preventDefault(); runSearch(inputValue) }} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-500 z-10" />
            <input
              name="q"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setSuggestOpen(true)}
              placeholder={t('searchProductsPlaceholder', lang)}
              className="input pl-9 w-full pr-12"
              autoComplete="off"
            />
            {inputValue && (
              <button type="button" onClick={() => { setInputValue(''); setParam('q', null) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300">
                <X className="w-4 h-4" />
              </button>
            )}
            <VoiceSearchInline onTranscript={(text) => { setInputValue(text); runSearch(text) }} className="absolute right-10 top-1/2 -translate-y-1/2" />
          </form>

          {suggestOpen && (
            <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[26rem] mt-2 card dark:bg-ink-900 dark:border-ink-800 shadow-modal z-30 animate-scale-in origin-top overflow-hidden">
              {recent.length > 0 && (
                <div className="p-3 border-b border-ink-100 dark:border-ink-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {t('recentSearches', lang)}
                    </p>
                    <button onClick={clearRecent} className="text-xs text-red-500 hover:underline">
                      {t('clear', lang)}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button key={r} onClick={() => { setInputValue(r); runSearch(r) }} className="text-xs px-3 py-1.5 rounded-full bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 border-b border-ink-100 dark:border-ink-800">
                <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> {t('popularSearches', lang)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((p) => (
                    <button key={p} onClick={() => { setInputValue(p); runSearch(p) }} className="text-xs px-3 py-1.5 rounded-full bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-2">
                    {t('categories', lang)}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {categories.slice(0, 6).map((cat) => (
                      <button key={cat.id} onClick={() => { setSuggestOpen(false); setParam('category', cat.slug) }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors text-left">
                        <span className="truncate">{cat.name_sw}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button onClick={() => setFiltersOpen(!filtersOpen)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filtersOpen ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:border-brand-300'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t('filters', lang)}</span>
          </button>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {q && <FilterChip label={`"${q}"`} onRemove={() => setParam('q', null)} />}
            {category && <FilterChip label={categories.find(c => c.slug === category)?.name_sw ?? category} onRemove={() => setParam('category', null)} />}
            {madeInZnz && <FilterChip label={t('madeInZanzibar', lang)} onRemove={() => setParam('made_in_zanzibar', null)} />}
            {sort !== 'newest' && <FilterChip label={sortLabel(sort, lang)} onRemove={() => setParam('sort', null)} />}
            <button onClick={clearAll} className="text-xs text-red-500 dark:text-red-400 font-medium hover:underline px-1">{t('clearAllFilters', lang)}</button>
          </div>
        )}

        {filtersOpen && (
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up">
            <div>
              <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-2">{t('categories', lang)}</p>
              <div className="flex flex-wrap gap-1.5">
{categories.map((cat) => (
                    <button key={cat.id} onClick={() => setParam('category', category === cat.slug ? null : cat.slug)} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${category === cat.slug ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300'}`}>
                      {cat.name_sw}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-2">{t('sortBy', lang)}</p>
              <div className="flex flex-col gap-1.5">
                {[['newest', t('sortNewest', lang)], ['price_asc', t('sortPriceAsc', lang)], ['price_desc', t('sortPriceDesc', lang)], ['popular', t('sortPopular', lang)]].map(([v, label]) => (
                  <button key={v} onClick={() => setParam('sort', v)} className={`text-xs text-left px-3 py-1.5 rounded-lg border transition-colors ${sort === v ? 'bg-brand-50 dark:bg-brand-500/15 border-brand-400 text-brand-700 dark:text-brand-300 font-semibold' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-2">{t('special', lang)}</p>
              <button onClick={() => setParam('made_in_zanzibar', madeInZnz ? null : 'true')} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${madeInZnz ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-amber-300'}`}>
                {t('madeInZanzibar', lang)}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {loading ? t('loading', lang) : `${t('products', lang)} ${count.toLocaleString()}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">{t('error', lang)}: {error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline">
              {t('retry', lang)}
            </button>
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={<Search className="w-10 h-10" />} title={t('noProductsFound', lang)} description={q ? `${t('noResultsFor', lang)} "${q}"` : t('tryAdjustingFilters', lang)} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setParam('page', String(page - 1))} disabled={page <= 1} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">← {t('prev', lang)}</button>
            <span className="text-sm text-ink-600 dark:text-ink-300 px-2">{t('page', lang)} {page} / {totalPages}</span>
            <button onClick={() => setParam('page', String(page + 1))} disabled={page >= totalPages} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">{t('next', lang)} →</button>
          </div>
        )}
      </div>
    </main>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-brand-900 dark:hover:text-brand-100"><X className="w-3 h-3" /></button>
    </span>
  )
}

function sortLabel(sort: string) {
  const map: Record<string, string> = { price_asc: 'Price: Low', price_desc: 'Price: High', popular: 'Popular' }
  return map[sort] ?? sort
}

function ProductCardSkeleton() {
  return (
    <div className="card dark:bg-ink-900 dark:border-ink-800 overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

