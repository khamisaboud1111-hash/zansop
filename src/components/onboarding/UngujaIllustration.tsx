'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/utils'

/**
 * Animated premium illustration of Unguja (Zanzibar) — the onboarding hero.
 *
 * Layers (bottom → top): ocean waves → islets → island map (gradient + inner
 * contours) → market stalls → flowing route → pulsing Stone Town pin →
 * bodaboda rider (SMIL <animateMotion>) → shopping-bag destination → dhow →
 * floating clouds → place labels.
 *
 * The rider uses native SVG <animateMotion> rather than CSS offset-path so it
 * is rock-solid across iOS Safari / Android WebView. Everything else animates
 * with Framer Motion, and all looping motion is disabled under
 * prefers-reduced-motion.
 */

const ROUTE_D = 'M186 322 C230 298 264 346 302 368 C330 385 348 416 356 432'

/* ── Small decorative glyphs ─────────────────────────────────────────── */

function Stall({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* striped awning */}
      <path d="M-13 0 L13 0 L10.5 -10 L-10.5 -10 Z" fill="#14b8a6" />
      <path d="M-4.5 0 L-4.5 -10 M4.5 0 L4.5 -10" stroke="#f0fdfa" strokeWidth="1.6" />
      {/* counter + spice jar */}
      <rect x="-9" y="0" width="18" height="13" rx="2.5" fill="#f0fdfa" opacity="0.92" />
      <circle cx="0" cy="-5" r="2.4" fill="#fdba74" />
      <path d="M-9 13 h18 M-6 13 v4 M6 13 v4" stroke="#99f6e4" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}

function Cloud({ x, y, scale = 1, duration = 7 }: { x: number; y: number; scale?: number; duration?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <motion.g
        animate={{ y: [0, -7, 0] }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
        fill="url(#cloudGrad)"
      >
        <ellipse cx="0" cy="0" rx="22" ry="10" />
        <ellipse cx="-15" cy="-5" rx="12" ry="8" />
        <ellipse cx="13" cy="-6" rx="14" ry="9" />
        <ellipse cx="27" cy="-2" rx="9" ry="6" />
      </motion.g>
    </g>
  )
}

function Dhow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
        {/* lateen sail */}
        <path d="M5 1 L5 -26 L19 -2 Z" fill="#fde68a" />
        <path d="M5 1 L5 -26" stroke="#f59e0b" strokeWidth="1.6" />
        {/* hull */}
        <path d="M-18 1 C-10 7 12 7 20 1 C16 6 8 8 -4 8 C-12 8 -17 5 -18 1 Z" fill="#f8fafc" />
        <path d="M-18 1 C-10 5 12 5 20 1" stroke="#94a3b8" strokeWidth="1.4" fill="none" />
      </motion.g>
    </g>
  )
}

/* ── Main illustration ───────────────────────────────────────────────── */

interface Props {
  /** Shrunk banner variant for mobile — crops the sky, drops clouds/dhow/labels. */
  compact?: boolean
  className?: string
}

export default function UngujaIllustration({ compact = false, className }: Props) {
  const reduce = useReducedMotion() ?? false

  return (
    <div
      className={cn('relative select-none', className)}
      role="img"
      aria-label="Illustrated map of Unguja island, Zanzibar — with a delivery rider travelling from Stone Town to a shopping bag"
    >
      <motion.svg
        viewBox={compact ? '0 84 560 480' : '0 0 560 620'}
        className="h-full w-auto"
        initial={reduce ? false : { opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <defs>
          <linearGradient id="islandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="55%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <radialGradient id="islandHighlight" cx="0.42" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
          </linearGradient>
          <filter id="islandShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#022c43" floodOpacity="0.45" />
          </filter>
          <filter id="routeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Ocean accents ─────────────────────────────────────────────── */}
        <g stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M76 150 q10 -6 20 0 M100 150 q10 -6 20 0" />
          <path d="M436 300 q10 -6 20 0 M460 300 q10 -6 20 0" />
          <path d="M288 588 q10 -6 20 0 M312 588 q10 -6 20 0" />
          {!compact && <path d="M56 268 q8 -5 16 0 M76 268 q8 -5 16 0" />}
        </g>

        {/* small offshore islets — Changuu (Prison Island) & Chumbe */}
        <g fill="#5eead4" opacity="0.75">
          <path d="M118 296 c10 -3 19 4 17 12 c-2 8 -13 11 -20 6 c-4 -3 -4 -13 3 -18 Z" />
          <ellipse cx="88" cy="396" rx="9" ry="7" />
        </g>

        {/* ── Island map — Unguja ───────────────────────────────────────── */}
        <g filter="url(#islandShadow)">
          <path
            d="M252 84 C296 88 340 112 350 158 C360 204 352 244 360 280 C368 316 372 344 358 370 C348 392 352 420 360 444 C368 468 356 498 334 516 C316 530 300 546 284 564 C270 578 250 588 236 580 C220 570 210 552 198 536 C186 520 172 508 158 496 C144 484 132 470 132 452 C132 434 138 418 144 402 C150 386 152 368 148 350 C146 332 140 314 138 296 C136 274 140 254 146 234 C152 214 158 194 170 176 C184 154 200 136 218 122 C232 108 242 92 252 84 Z"
            fill="url(#islandGrad)"
          />
          {/* Fumba peninsula — same fill, no stroke, so the two merge seamlessly */}
          <path
            d="M146 398 C130 414 112 436 102 462 C94 482 102 496 118 498 C132 500 144 488 150 470 C156 452 156 432 152 414 C150 404 148 400 146 398 Z"
            fill="url(#islandGrad)"
          />
          <path
            d="M252 84 C296 88 340 112 350 158 C360 204 352 244 360 280 C368 316 372 344 358 370 C348 392 352 420 360 444 C368 468 356 498 334 516 C316 530 300 546 284 564 C270 578 250 588 236 580 C220 570 210 552 198 536 C186 520 172 508 158 496 C144 484 132 470 132 452 C132 434 138 418 144 402 C150 386 152 368 148 350 C146 332 140 314 138 296 C136 274 140 254 146 234 C152 214 158 194 170 176 C184 154 200 136 218 122 C232 108 242 92 252 84 Z"
            fill="url(#islandHighlight)"
          />
          {/* inner contour rings — premium map texture */}
          <g fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2">
            <path d="M218 128 C262 124 312 136 334 168" />
            <path d="M196 210 C244 196 296 206 322 240" />
            <path d="M180 296 C214 286 258 300 288 336" />
          </g>
        </g>

        {/* ── Market / store stalls ─────────────────────────────────────── */}
        <Stall x={252} y={150} />   {/* Nungwi */}
        <Stall x={200} y={362} />   {/* Stone Town market */}
        <Stall x={340} y={474} />   {/* Paje */}

        {/* ── Delivery route (Stone Town → Paje) ────────────────────────── */}
        <path d={ROUTE_D} fill="none" stroke="#5eead4" strokeOpacity="0.28" strokeWidth="10" strokeLinecap="round" filter="url(#routeGlow)" />
        <motion.path
          d={ROUTE_D}
          fill="none"
          stroke="#99f6e4"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="3 8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, strokeDashoffset: reduce ? 0 : -176 }}
          transition={
            reduce
              ? { opacity: { duration: 0.8 } }
              : {
                  opacity: { duration: 0.8, delay: 0.4 },
                  strokeDashoffset: { duration: 7, ease: 'linear', repeat: Infinity },
                }
          }
        />

        {/* ── Pulsing location pin — Stone Town ─────────────────────────── */}
        <g>
          {!reduce && (
            <>
              <motion.circle
                cx={185}
                cy={318}
                r={13}
                fill="none"
                stroke="#5eead4"
                strokeWidth={2}
                animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              />
              <motion.circle
                cx={185}
                cy={318}
                r={13}
                fill="none"
                stroke="#99f6e4"
                strokeWidth={1.6}
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
              />
            </>
          )}
          <ellipse cx={185} cy={354} rx={10} ry={3} fill="rgba(2,6,23,0.4)" />
          <path d="M185 290 C199 290 209 301 209 313 C209 330 185 354 185 354 C185 354 161 330 161 313 C161 301 171 290 185 290 Z" fill="#5eead4" />
          <circle cx={185} cy={311} r={5} fill="#04322c" />
        </g>

        {/* ── Shopping bag destination — Paje ───────────────────────────── */}
        <g transform="translate(356 434)">
          <circle r={15} fill="rgba(251,191,36,0.16)" />
          <motion.g animate={reduce ? undefined : { scale: [1, 1.12, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M-10 -7 C-10 -13 10 -13 10 -7" stroke="#fde68a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M-12 -3 a4 4 0 0 1 4 -4 h16 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4 Z" fill="#fbbf24" />
            <path d="M-8 1 v11 M0 1 v13 M8 1 v11" stroke="#fff7ed" strokeWidth="1.6" strokeLinecap="round" />
          </motion.g>
        </g>

        {/* ── Bodaboda rider (SMIL — best cross-browser path following) ─── */}
        {reduce ? (
          <g transform="translate(200 312)">
            <Bodaboda />
          </g>
        ) : (
          <g>
            <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path={ROUTE_D} />
            <Bodaboda />
          </g>
        )}

        {/* ── Floating clouds ───────────────────────────────────────────── */}
        {!compact && !reduce && (
          <>
            <Cloud x={116} y={128} duration={6.5} />
            <Cloud x={306} y={92} scale={0.8} duration={8.5} />
            <Cloud x={430} y={180} scale={0.65} duration={7.5} />
          </>
        )}

        {/* ── Dhow sailing the channel ──────────────────────────────────── */}
        {!compact && !reduce && <Dhow x={96} y={252} />}

        {/* ── Place labels ──────────────────────────────────────────────── */}
        {!compact && (
          <g
            fontFamily="var(--font-display), Poppins, sans-serif"
            fontWeight="700"
            fontSize="11"
            letterSpacing="0.14em"
            fill="#ffffff"
            fillOpacity="0.75"
          >
            <text x={140} y={316} textAnchor="end">STONE TOWN</text>
            <text x={392} y={440} textAnchor="start">PAJE</text>
          </g>
        )}
      </motion.svg>
    </div>
  )
}

function Bodaboda() {
  return (
    <g aria-hidden="true">
      {/* wheels */}
      <circle cx={-10} cy={0} r={6} fill="#f8fafc" />
      <circle cx={10} cy={0} r={6} fill="#f8fafc" />
      <circle cx={-10} cy={0} r={2.4} fill="#0f766e" />
      <circle cx={10} cy={0} r={2.4} fill="#0f766e" />
      {/* deck + front fork */}
      <path d="M-10 -4 L9 -4 L12 -1 L-12 -1 Z" fill="#f8fafc" />
      <path d="M9 -2 L11 -7" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 -8 L13 -8" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
      {/* rider */}
      <circle cx={0} cy={-9} r={4.2} fill="#fde68a" />
      <path d="M0 -5 L0 -1" stroke="#f8fafc" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-3 -7 L3 -7" stroke="#0f766e" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}

