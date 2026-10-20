'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface Testimonial {
  id: string
  author_name: string
  author_role: string | null
  avatar_url: string | null
  quote_en: string
  quote_sw: string
  rating: number | null
  [key: string]: any
}

export default function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const lang = useLangStore((s) => s.lang)

  if (testimonials.length === 0) return null

  return (
    <section className="section bg-ink-50/50 dark:bg-ink-900/40">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-8">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold tracking-wide uppercase mb-4"
          >
            <Star className="w-3.5 h-3.5" /> {t('whatPeopleSay', lang)}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-white"
          >
            {t('trustedByCommunity', lang)}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card p-5 sm:p-6"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-brand-100 dark:text-brand-900/40" />

              {testimonial.rating && (
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < testimonial.rating! ? 'fill-amber-400 text-amber-400' : 'text-ink-200 dark:text-ink-700'}`}
                    />
                  ))}
                </div>
              )}

              <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed mb-4 relative z-10">
                &ldquo;{lang === 'sw' ? testimonial.quote_sw : testimonial.quote_en}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {testimonial.author_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{testimonial.author_name}</p>
                  {testimonial.author_role && (
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">{testimonial.author_role}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

