'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Store, ShoppingBag, Package, Medal, Sparkles, ArrowRight, ShieldCheck, Bike, BadgeCheck } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface HomeStats {
  active_sellers: number
  verified_stores: number
  products_available: number
  orders_delivered: number
  active_riders: number
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <motion.div
      variants={item}
      className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10 hover:bg-white/15 transition-colors"
    >
      <p className="text-white font-display font-bold text-lg">{value}</p>
      <p className="text-white/70 text-[10px] font-medium flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
    </motion.div>
  )
}

export default function HeroSection({ stats }: { stats: HomeStats }) {
  const lang = useLangStore((s) => s.lang)
  return (
    <section className="relative isolate overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem] bg-gradient-to-br from-teal-800 via-teal-600 to-emerald-500 animate-gradient-pan">

      {/* Decorative orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 animate-pulse-glow" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-amber-400/20 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Soft grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating deco cards — visible on md+ */}
      <div className="hidden md:block absolute top-24 right-16 z-10 animate-float-slow">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <p className="text-white text-xs font-bold leading-tight">{t('securePayments', lang)}</p>
            <p className="text-white/70 text-[10px]">M-Pesa · Tigo · Airtel</p>
          </div>
        </div>
      </div>
      <div className="hidden md:block absolute top-1/2 right-8 z-10 animate-float-fast" style={{ animationDelay: '1s' }}>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Bike className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <p className="text-white text-xs font-bold leading-tight">{t('fastDelivery', lang)}</p>
            <p className="text-white/70 text-[10px]">{t('liveGpsTracking', lang)}</p>
          </div>
        </div>
      </div>
      <div className="hidden md:block absolute top-[70%] right-24 z-10 animate-float-slow" style={{ animationDelay: '2s' }}>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <BadgeCheck className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <p className="text-white text-xs font-bold leading-tight">{t('verifiedSellers', lang)}</p>
            <p className="text-white/70 text-[10px]">{t('verified100', lang)}</p>
          </div>
        </div>
      </div>

      {/* Rotating dashed ring */}
      <div className="hidden lg:block absolute -bottom-24 right-64 w-72 h-72 rounded-full border border-dashed border-white/20 animate-spin-slow" />

      <div className="page-container relative z-10 pt-10 pb-20 sm:pt-16 sm:pb-24">
        <motion.div variants={container} initial="hidden" animate="visible">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-[11px] font-bold tracking-wide uppercase mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {t('zanzibarTopMarket', lang)}
          </motion.span>

          <motion.h1
            variants={item}
            className="font-display font-black text-white text-3xl sm:text-5xl lg:text-6xl leading-[1.08] mb-3 max-w-2xl"
          >
            {t('heroTitlePart1', lang)}{' '}
            <span className="shimmer-text">{t('heroTitlePart2', lang)}</span>
          </motion.h1>

          <motion.p variants={item} className="text-white/85 text-sm sm:text-lg mb-7 max-w-md">
            {t('heroSubtitle', lang)}
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-3 mb-8">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
            >
              {t('startShopping', lang)}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register?type=seller"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30 backdrop-blur-sm hover:-translate-y-0.5 active:scale-95"
            >
              <Store className="w-4 h-4" /> {t('openStore', lang)}
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        {stats.active_sellers > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl"
          >
            <StatCard icon={ShoppingBag} value={stats.products_available} label={t('products', lang)} />
            <StatCard icon={Store} value={stats.active_sellers} label={t('sellers', lang)} />
            <StatCard icon={Package} value={stats.orders_delivered} label={t('ordersDelivered', lang)} />
            <StatCard icon={Medal} value={stats.active_riders} label={t('riders', lang)} />
          </motion.div>
        )}
      </div>
    </section>
  )
}

export type { HomeStats }

