'use client'

import { motion } from 'framer-motion'
import { Phone, PackageCheck, Bike, MapPin, CheckCircle2 } from 'lucide-react'
import { useLangStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'

const STEPS: { icon: any; color: string; ring: string; titleKey: TranslationKey; descKey: TranslationKey; tagKey: TranslationKey }[] = [
  {
    icon: Phone,
    color: 'from-orange-500 to-amber-500',
    ring: 'bg-orange-50 dark:bg-orange-950/40',
    titleKey: 'shipStep1Title',
    descKey: 'shipStep1Desc',
    tagKey: 'step1',
  },
  {
    icon: PackageCheck,
    color: 'from-emerald-500 to-green-500',
    ring: 'bg-emerald-50 dark:bg-emerald-950/40',
    titleKey: 'shipStep2Title',
    descKey: 'shipStep2Desc',
    tagKey: 'step2',
  },
  {
    icon: Bike,
    color: 'from-sky-500 to-blue-500',
    ring: 'bg-sky-50 dark:bg-sky-950/40',
    titleKey: 'shipStep3Title',
    descKey: 'shipStep3Desc',
    tagKey: 'step3',
  },
  {
    icon: MapPin,
    color: 'from-violet-500 to-purple-500',
    ring: 'bg-violet-50 dark:bg-violet-950/40',
    titleKey: 'shipStep4Title',
    descKey: 'shipStep4Desc',
    tagKey: 'step4',
  },
  {
    icon: CheckCircle2,
    color: 'from-teal-500 to-emerald-500',
    ring: 'bg-teal-50 dark:bg-teal-950/40',
    titleKey: 'shipStep5Title',
    descKey: 'shipStep5Desc',
    tagKey: 'step5',
  },
]

export default function ShippingSteps() {
  const lang = useLangStore((s) => s.lang)
  return (
    <div>
      <div className="text-center max-w-xl mx-auto mb-8">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[11px] font-bold tracking-wide uppercase mb-4"
        >
          <Bike className="w-3.5 h-3.5" /> {t('shipping', lang)}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-white"
        >
          {t('howShippingWorks', lang)}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-ink-500 dark:text-ink-300 mt-2"
        >
          {t('shippingSubtitle', lang)}
        </motion.p>
      </div>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="hidden sm:block absolute left-1/2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-200 via-brand-200 to-emerald-200 dark:from-teal-900 dark:via-brand-800 dark:to-emerald-900" />

        <div className="space-y-6 sm:space-y-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.tagKey}
                initial={{ opacity: 0, x: i % 2 === 0 ? -28 : 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className={`relative flex items-start gap-4 sm:w-1/2 ${i % 2 === 0 ? 'sm:mr-auto sm:pr-10 sm:flex-row-reverse sm:text-right' : 'sm:ml-auto sm:pl-10'}`}
              >
                {/* Icon bubble */}
                <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} shadow-card flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <div className={`flex-1 rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card p-4 ${i % 2 === 0 ? 'sm:items-end' : ''}`}>
                  <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-1">{t(step.tagKey, lang)}</p>
                  <h3 className="font-bold text-ink-900 dark:text-white text-base mb-1">{t(step.titleKey, lang)}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed">{t(step.descKey, lang)}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

