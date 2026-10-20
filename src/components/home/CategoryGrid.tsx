'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import {
  ShoppingBag, Utensils, Shirt, Gem, Home, Laptop,
  BookOpen, Baby, Wrench, Leaf, Sparkles
} from 'lucide-react'

interface Category {
  id: string
  name_en: string
  name_sw: string
  slug: string
  icon: string
  [key: string]: any
}

const ICON_MAP: Record<string, any> = {
  shopping_bag: ShoppingBag,
  utensils: Utensils,
  shirt: Shirt,
  gem: Gem,
  home: Home,
  laptop: Laptop,
  book: BookOpen,
  baby: Baby,
  wrench: Wrench,
  leaf: Leaf,
}

function getCategoryIcon(iconName: string) {
  return ICON_MAP[iconName] || ShoppingBag
}

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const lang = useLangStore((s) => s.lang)

  if (categories.length === 0) return null

  return (
    <section className="section">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-8">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spice-100 dark:bg-spice-900/40 text-spice-700 dark:text-spice-300 text-[11px] font-bold tracking-wide uppercase mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" /> {t('browseCategories', lang)}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-white"
          >
            {t('shopByCategory', lang)}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-ink-500 dark:text-ink-300 mt-2"
          >
            {t('categorySubtitle', lang)}
          </motion.p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.slice(0, 6).map((cat, i) => {
            const Icon = getCategoryIcon(cat.icon)
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow-brand group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-ink-800 dark:text-ink-100 text-center leading-tight">
                    {lang === 'sw' ? cat.name_sw : cat.name_en}
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:gap-2.5 transition-all"
          >
            {t('seeAllCategories', lang)} →
          </Link>
        </div>
      </div>
    </section>
  )
}

