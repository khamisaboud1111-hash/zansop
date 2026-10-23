'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, ArrowRight, Waves } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import Link from 'next/link'

export default function WelcomePage() {
  const router = useRouter()
  const { lang } = useLangStore()
  const isSw = lang === 'sw'

  const handleGetStarted = () => {
    router.push('/onboarding?mode=signup')
  }

  const handleLogIn = () => {
    router.push('/onboarding?mode=signin')
  }

  return (
    <div className="relative min-h-screen min-h-[100svh] flex flex-col bg-white overflow-hidden">
      {/* Hero Photograph - Zanzibar */}
      <div className="relative w-full" style={{ height: '35svh', maxHeight: '300px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/images/zanzibar/stone-town-aerial.jpg)' }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent" />
        </motion.div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between px-6 py-8 w-full max-w-md mx-auto">
        {/* Zanshop Logo with Zanzibar backdrop */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center"
        >
          <div className="relative w-32 h-32 sm:w-36 sm:h-36">
            {/* Zanzibar backdrop behind logo - circular */}
            <div
              className="absolute inset-0 rounded-full bg-cover bg-center"
              style={{
                backgroundImage: 'url(/images/zanzibar/stone-town-aerial.jpg)',
                backgroundPosition: 'center 30%',
              }}
              aria-hidden="true"
            />
            {/* Logo with multiply blend to remove white background */}
            <img
              src="/zanshop-logo.jpeg"
              alt="Zanshop - Zanzibar Multivendor Marketplace"
              className="w-full h-full object-contain mix-blend-multiply"
              style={{ filter: 'contrast(1.1) brightness(0.95)' }}
            />
          </div>

          {/* Brand Slogan */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-3 text-center text-sm font-semibold tracking-wider text-teal-700 uppercase"
          >
            {isSw ? 'Nunuza &middot; Uuze &middot; Mtandaoni' : 'Buy &middot; Sell &middot; Online'}
          </motion.p>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center px-4"
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
            {isSw
              ? 'Kila unachohitaji hapa Zanzibar.'
              : 'everything you need here in zanzibar'}
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {isSw
              ? 'Soko la mtandaoni la kuaminika kwa bidhaa zote, malipo salama, na usafirishaji wa haraka.'
              : 'The trusted online marketplace for all products, secure payments, and fast delivery.'}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full space-y-3 pb-6 safe-bottom"
        >
          {/* Primary: Get Started */}
          <button
            onClick={handleGetStarted}
            className="group w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full text-base font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30"
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #06b6d4 100%)',
              boxShadow: '0 4px 24px rgba(20, 184, 166, 0.4), 0 0 0 1px rgba(20, 184, 166, 0.1)',
            }}
            aria-label={isSw ? 'Anza sasa' : 'Get Started'}
          >
            <span className="relative z-10">{isSw ? 'Anza Sasa' : 'Get Started'}</span>
            <motion.div
              layoutId="arrow"
              className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-1"
            >
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
            </motion.div>
          </button>

          {/* Secondary: Log In */}
          <button
            onClick={handleLogIn}
            className="group w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full text-base font-bold transition-all duration-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30"
            style={{
              background: 'white',
              color: '#0d9488',
              border: '2px solid #14b8a6',
              boxShadow: '0 2px 12px rgba(20, 184, 166, 0.15)',
            }}
            aria-label={isSw ? 'Ingia' : 'Log In'}
          >
            {isSw ? 'Ingia' : 'Log In'}
          </button>
        </motion.div>

        {/* Decorative Wave */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            style={{ opacity: 0.6 }}
          >
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <path
              d="M0,64 C150,120 350,0 500,64 C650,128 850,0 1000,64 C1150,128 1300,64 1440,64 L1440,120 L0,120 Z"
              fill="url(#waveGradient)"
            />
            <path
              d="M0,80 C180,140 400,40 550,80 C700,120 900,40 1050,80 C1200,120 1350,80 1440,80 L1440,120 L0,120 Z"
              fill="url(#waveGradient)"
              style={{ opacity: 0.5 }}
            />
          </svg>
        </motion.div>
      </main>

      {/* Bottom attribution */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400 dark:text-slate-500"
      >
        © 2026 Zanshop. All rights reserved.
      </motion.p>
    </div>
  )
}