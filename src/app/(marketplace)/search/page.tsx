'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, Search, Clock, TrendingUp, Grid3X3, List } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui'
import { MobileSheet } from '@/components/shared/MobileSheet'
import { SkeletonGrid } from '@/components/shared/SkeletonComposites'
import type { Category } from '@/types'
import { cn } from '@/utils'
import { VoiceSearchInline } from '@/components/search/VoiceSearchButton'

const RECENT_KEY = 'dj_recent_searches'
const POPULAR_SEARCHES = ['Karafuu', 'Kanga', 'Mafuta ya Nazi', 'Vazi la Kiislamu', 'Vikapu vya Ukili', 'Electronics', 'Home & Garden', 'Beauty', 'Agriculture']

function catName(cat: Category, lang: Language) {
  return lang === 'sw' ? cat.name_sw : cat.name_en
}

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function pushRecent(q: string) {
  if (typeof window === 'undefined' || !q.trim()) return
  const current = getRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())
  const updated = [q, ...current].slice(0, 6)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

function sortLabel(sort: string, lang: Language) {
  const map: Record<string, string> = {
    price_asc: t('sortPriceAsc', lang),
    price_desc: t('sortPriceDesc', lang),
    popular: t('sortPopular', lang)
  }
  return map[sort] ?? sort
}

export default function SearchPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { lang } = useLangStore()
  const supabase = useMemo(() => createClient(), [])

  const [categories, setCategories] = useState<Category[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const q          = params.get('q') ?? ''
  const category   = params.get('category') ?? ''
  const sort       = (params.get('sort') ?? 'newest') as any
  const madeInZnz  = params.get('made_in_zanzibar') === 'true'
  const page       = Number(params.get('page') ?? '1')

  const { products, loading, count, totalPages } = useMarketplaceProducts({
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
    router.push(`/search?${p.toString()}`)
  }

  function runSearch(value: string) {
    if (!value.trim()) return
    pushRecent(value.trim())
    setRecent(getRecent())
    setSuggestOpen(false)
    setParam('q', value.trim())
  }

  function clearAll() {
    router.push('/search')
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY)
    setRecent([])
  }

  const hasFilters = !!(q || category || madeInZnz || sort !== 'newest')

  const filterControls = (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('type', lang)}</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setParam('category', category === cat.slug ? null : cat.slug)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                category === cat.slug
                  ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/25'
                  : 'border-border text-muted-foreground hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10'
              )}
            >
              {catName(cat, lang)}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('sortBy', lang)}</p>
        <div className="flex flex-col gap-1.5">
          {([
            ['newest', t('sortNewest', lang)],
            ['price_asc', t('sortPriceAsc', lang)],
            ['price_desc', t('sortPriceDesc', lang)],
            ['popular', t('sortPopular', lang)]
          ] as [string, string][]).map(([v, label]) => (
            <motion.button
              key={v}
              whileHover={{ x: 2 }}
              onClick={() => setParam('sort', v)}
              className={cn(
                "text-xs text-left px-3 py-2 rounded-xl border transition-all",
                sort === v
                  ? 'bg-gradient-to-r from-brand-500/15 to-amber-500/15 border-brand-400 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'border-border text-muted-foreground hover:border-brand-300 hover:bg-muted/50'
              )}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('special', lang)}</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setParam('made_in_zanzibar', madeInZnz ? null : 'true')}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
            madeInZnz
              ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600 shadow-md'
              : 'border-border text-muted-foreground hover:border-amber-300'
          )}
        >
          {t('madeInZanzibar', lang)}
        </motion.button>
      </div>
    </div>
  )

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-6">
        {/* Search bar */}
        <div ref={searchWrapRef} className="mb-5 relative">
          <motion.form
            onSubmit={(e) => { e.preventDefault(); runSearch(inputValue) }}
            className="flex-1 relative flex gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
              <div className="relative flex-1">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/10 to-amber-500/10 opacity-0 focus-within:opacity-100 blur-xl transition-opacity duration-500" />
              <div className="relative flex items-center bg-white dark:bg-ink-800 border border-ink-200/60 dark:border-ink-700/60 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500/50 transition-all duration-300">
                <Search className="absolute left-4 w-4 h-4 text-ink-400 dark:text-ink-500" />
                <input
                  name="q"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setSuggestOpen(true)}
                  placeholder={t('search', lang)}
                  className="w-full bg-transparent py-3 pl-12 pr-12 text-sm focus:outline-none placeholder:text-ink-400 dark:placeholder:text-ink-500"
                  autoComplete="off"
                />
                <div className="absolute right-2">
                  <VoiceSearchInline onTranscript={(text) => { setInputValue(text); runSearch(text) }} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {inputValue && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => { setInputValue(''); setParam('q', null) }}
                  className="p-2.5 rounded-xl text-ink-400 dark:text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-95 transition-all"
            >
              {t('searchButton', lang)}
            </motion.button>
          </motion.form>

          {/* Suggestions dropdown */}
          {suggestOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 sm:right-auto sm:w-[26rem] mt-3 rounded-3xl border border-white/20 dark:border-white/10 bg-card/95 dark:bg-ink-900/95 backdrop-blur-2xl shadow-2xl z-30 overflow-hidden"
            >
              {recent.length > 0 && (
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {t('recentSearches', lang)}
                    </p>
                    <button
                      onClick={clearRecent}
                      className="text-xs text-red-500 dark:text-red-400 hover:underline"
                    >
                      {t('clear', lang)}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <motion.button
                        key={r}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => { setInputValue(r); runSearch(r) }}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                      >
                        {r}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-b border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> {t('popularSearches', lang)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((p) => (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.03 }}
                      onClick={() => { setInputValue(p); runSearch(p) }}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                    >
                      {p}
                    </motion.button>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {t('categories', lang)}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {categories.slice(0, 6).map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileHover={{ x: 2 }}
                        onClick={() => { setSuggestOpen(false); setParam('category', cat.slug) }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/50 transition-colors text-left"
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{catName(cat, lang)}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Toolbar: Filters + View Mode */}
        <motion.div
          className="flex items-center justify-between mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                filtersOpen
                  ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/25'
                  : 'bg-card border-border text-foreground hover:border-brand-300'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t('filter', lang)}</span>
            </motion.button>

            {/* View mode toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/30 rounded-xl p-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-all",
                  viewMode === 'grid'
                    ? 'bg-brand-500 text-white shadow-lg'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
                )}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-all",
                  viewMode === 'list'
                    ? 'bg-brand-500 text-white shadow-lg'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
                )}
              >
                <List className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            {loading ? t('searching', lang) : `${count.toLocaleString()} ${t('products', lang).toLowerCase()}`}
          </p>
        </motion.div>

        {/* Active filters */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {q && <FilterChip label={`"${q}"`} onRemove={() => setParam('q', null)} />}
              {category && (
                <FilterChip
                  label={categories.find(c => c.slug === category) ? catName(categories.find(c => c.slug === category)!, lang) : category}
                  onRemove={() => setParam('category', null)}
                />
              )}
              {madeInZnz && <FilterChip label={t('madeInZanzibar', lang)} onRemove={() => setParam('made_in_zanzibar', null)} />}
              {sort !== 'newest' && <FilterChip label={sortLabel(sort, lang)} onRemove={() => setParam('sort', null)} />}
              <motion.button
                whileHover={{ scale: 1.03 }}
                onClick={clearAll}
                className="text-xs text-red-500 dark:text-red-400 font-medium hover:underline px-1"
              >
                {t('clearAllFilters', lang)}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter panel */}
        <AnimatePresence>
          {filtersOpen && !isMobile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-card/80 border border-border/50 rounded-2xl p-5 mb-5 backdrop-blur-sm"
            >
              {filterControls}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile filter sheet */}
        {isMobile && (
          <MobileSheet
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t('filter', lang)}
            side="bottom"
          >
            {filterControls}
          </MobileSheet>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SkeletonGrid count={8} />
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <EmptyState
                icon={<Search className="w-10 h-10" />}
                title={t('noProductsFound', lang)}
                description={q ? `${t('noResultsFor', lang)} "${q}"` : t('tryAdjustingFilters', lang)}
                action={
                  hasFilters ? (
                    <button onClick={clearAll} className="btn-secondary text-sm">
                      {t('clearAllFilters', lang)}
                    </button>
                  ) : undefined
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "grid gap-3 sm:gap-4",
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {products.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="flex items-center justify-center gap-2 mt-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setParam('page', String(page - 1))}
              disabled={page <= 1}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all",
                page <= 1
                  ? 'bg-ink-100 dark:bg-ink-800 text-ink-400 cursor-not-allowed'
                  : 'bg-card border border-border text-ink-700 dark:text-ink-200 hover:border-brand-300'
              )}
            >
              ← {t('previous', lang)}
            </motion.button>
            <span className="text-sm text-muted-foreground px-2">
              {t('page', lang)} {page} / {totalPages}
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setParam('page', String(page + 1))}
              disabled={page >= totalPages}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all",
                page >= totalPages
                  ? 'bg-ink-100 dark:bg-ink-800 text-ink-400 cursor-not-allowed'
                  : 'bg-card border border-border text-ink-700 dark:text-ink-200 hover:border-brand-300'
              )}
            >
              {t('next', lang)} →
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 rounded-full text-xs font-medium border border-brand-200 dark:border-brand-700/30"
    >
      {label}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="w-3.5 h-3.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </motion.button>
    </motion.span>
  )
}

