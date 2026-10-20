'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLangStore } from "@/store"
import { t, type Language } from "@/i18n/translations"

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili", flag: "🇹🇿" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
]

export default function MobileLanguageSelector() {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  if (!mounted) {
    return (
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-ink-900/80 backdrop-blur-xl border-b border-ink-200/50 dark:border-ink-700/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="w-12 h-10 flex items-center justify-center" />
          <div className="flex-1" />
          <div className="w-12 h-10 flex items-center justify-center" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <motion.div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-ink-900/80 backdrop-blur-xl border-b border-ink-200/50 dark:border-ink-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-ink-800/70 backdrop-blur-sm border border-ink-200/50 dark:border-ink-700/50 hover:bg-ink-100/50 dark:hover:bg-ink-700/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Language"
              aria-expanded={open}
            >
              <span className="text-xl font-bold" role="img" aria-label={currentLang.nativeLabel}>
                {currentLang.flag}
              </span>
              <span className="hidden sm:inline font-medium text-sm text-ink-700 dark:text-ink-200">
                {currentLang.nativeLabel}
              </span>
              <motion.svg
                className="w-4 h-4 text-ink-500 dark:text-ink-400 transition-transform duration-200"
                animate={{ rotate: open ? 180 : 0 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </motion.svg>
            </button>

            <AnimatePresence>
              {open && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                  />
                  <motion.div
                    className="fixed right-4 top-14 z-50 lg:hidden"
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200/50 dark:border-ink-700/50 shadow-2xl overflow-hidden min-w-[180px]">
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                          Select Language
                        </p>
                        {LANGUAGES.map((l) => (
                          <motion.button
                            key={l.code}
                            onClick={() => {
                              setLang(l.code)
                              setOpen(false)
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative overflow-hidden"
                            style={{
                              backgroundColor: lang === l.code
                                ? "rgb(20 184 166 / 0.1)"
                                : "transparent",
                            }}
                          >
                            <span className="text-xl font-bold" role="img" aria-label={l.nativeLabel}>
                              {l.flag}
                            </span>
                            <span className="flex-1 text-left font-medium text-ink-700 dark:text-ink-200">
                              {l.nativeLabel}
                            </span>
                            {lang === l.code && (
                              <motion.div
                                className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

