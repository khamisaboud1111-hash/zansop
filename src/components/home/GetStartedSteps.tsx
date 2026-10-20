'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus, Compass, ShoppingCart, Truck, ArrowRight, Sparkles } from 'lucide-react'
import { useLangStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'

const STEPS: { icon: any; step: string; titleKey: TranslationKey; descKey: TranslationKey; ctaKey: TranslationKey; href: string }[] = [
  {
    icon: UserPlus,
    step: '01',
    titleKey: 'gs1Title',
    descKey: 'gs1Desc',
    ctaKey: 'gs1Cta',
    href: '/register',
  },
  {
    icon: Compass,
    step: '02',
    titleKey: 'gs2Title',
    descKey: 'gs2Desc',
    ctaKey: 'gs2Cta',
    href: '/search',
  },
  {
    icon: ShoppingCart,
    step: '03',
    titleKey: 'gs3Title',
    descKey: 'gs3Desc',
    ctaKey: 'gs3Cta',
    href: '/register',
  },
  {
    icon: Truck,
    step: '04',
    titleKey: 'gs4Title',
    descKey: 'gs4Desc',
    ctaKey: 'gs4Cta',
    href: '/register',
  },
]

export default function GetStartedSteps() {
  const lang = useLangStore((s) => s.lang)
  return (
    <section className="section relative overflow-hidden bg-gradient-to-b from-white to-brand-50/40 dark:from-ink-950 dark:to-ink-900/40">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-40 rounded-full bg-brand-500/10 blur-3xl animate-pulse-glow" />

      <div className="page-container relative">
        <div className="text-center max-w-xl mx-auto mb-10">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-[11px] font-bold tracking-wide uppercase mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" /> {t('startToday', lang)}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-white"
          >
            {t('fourEasySteps', lang)}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-ink-500 dark:text-ink-300 mt-2"
          >
            {t('getStartedSubtitle', lang)}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                className="group relative"
              >
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-9 left-[calc(50%+2.75rem)] w-[calc(100%-3.5rem)] h-0.5 bg-gradient-to-r from-brand-300 to-brand-200 dark:from-brand-700 dark:to-brand-800" />
                )}

                <div className="relative h-full rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card hover:shadow-card-hover p-5 transition-all duration-300 group-hover:-translate-y-1.5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative w-[4.5rem] h-[4.5rem] rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-glow-brand group-hover:scale-105 transition-transform">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-display font-black text-4xl text-ink-100 dark:text-ink-800 transition-colors group-hover:text-brand-200 dark:group-hover:text-brand-900">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="font-bold text-ink-900 dark:text-white text-base mb-1.5">{t(s.titleKey, lang)}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed mb-4">{t(s.descKey, lang)}</p>

                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300 group-hover:gap-2.5 transition-all"
                  >
                    {t(s.ctaKey, lang)} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

