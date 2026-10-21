'use client'

import Link from 'next/link'
import { motion, MotionConfig } from 'framer-motion'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import UngujaIllustration from '@/components/onboarding/UngujaIllustration'
import { cn } from '@/utils'

/**
 * Full-screen premium onboarding shell: animated ocean background, DJ header,
 * responsive split (illustration + headline | glass card), footer.
 * All Framer Motion animation here honours prefers-reduced-motion.
 */

function Headline({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-200 backdrop-blur-glass">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-300 shadow-[0_0_8px_2px_rgba(94,234,212,0.6)]" />
        Zanzibar · Tanzania
      </span>

      <h1
        className={cn(
          'font-display font-black text-white',
          size === 'lg'
            ? 'mt-5 text-4xl leading-[1.08] xl:text-5xl'
            : 'mt-4 text-[1.7rem] leading-[1.12] sm:text-3xl',
        )}
      >
        Sell and Buy Online{' '}
        <span className="bg-gradient-to-r from-brand-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
          Wherever You Are in Zanzibar
        </span>
      </h1>

      <p className={cn('mt-4 text-white/75', size === 'lg' ? 'text-xl' : 'text-base sm:text-lg')}>
        Shopping Made Easy.
      </p>
    </motion.div>
  )
}

export default function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#041f24] text-white">
        {/* ── Ocean background ─────────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a3d46] via-[#07303a] to-[#031824]" />
          <div className="absolute inset-0 animate-gradient-pan bg-[radial-gradient(70%_55%_at_50%_0%,rgba(125,211,252,0.16),transparent_70%)]" />

          {/* drifting light blobs */}
          <motion.div
            className="absolute -left-[12%] -top-[18%] h-[62vh] w-[62vh] rounded-full bg-brand-500/25 blur-3xl"
            initial={{ opacity: 0.45, scale: 1 }}
            animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.15, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-[14%] top-[8%] h-[56vh] w-[56vh] rounded-full bg-cyan-400/20 blur-3xl"
            initial={{ opacity: 0.35, scale: 1.1 }}
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [1.1, 1, 1.1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-[26%] left-[28%] h-[52vh] w-[52vh] rounded-full bg-amber-300/10 blur-3xl"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Zanshop home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 font-display text-sm font-black text-white shadow-glow-brand">
              DJ
            </span>
            <span className="font-display text-lg font-black text-white">
              Duka <span className="text-brand-300">Janja</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-glass">
            <LanguageSwitcher variant="icon" />
          </div>
        </header>

        {/* ── Split content ────────────────────────────────────────────── */}
        <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-5 py-6 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-8">
          {/* Desktop left panel */}
          <div className="hidden w-full max-w-xl flex-col items-center text-center lg:flex">
            <Headline />
            <UngujaIllustration className="mt-4 h-[min(44vh,430px)] w-full" />
          </div>

          {/* Mobile banner + headline */}
          <div className="flex flex-col items-center gap-5 lg:hidden">
            <UngujaIllustration compact className="h-44 w-auto sm:h-52" />
            <Headline size="sm" />
          </div>

          {/* Glass card column */}
          <div className="flex justify-center">{children}</div>
        </main>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="relative z-10 pb-6 pt-2 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Zanshop · Zanzibar, Tanzania
        </footer>
      </div>
    </MotionConfig>
  )
}


