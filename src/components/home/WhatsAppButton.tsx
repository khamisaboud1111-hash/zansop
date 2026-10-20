'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

const WHATSAPP_NUMBER = '255777000000'

export default function WhatsAppButton() {
  const lang = useLangStore((s) => s.lang)
  const message = encodeURIComponent(t('whatsappIntro', lang))
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: 'spring', stiffness: 200 }}
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#25D366] text-white font-semibold text-sm rounded-full shadow-lg hover:bg-[#20bd5a] hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
      aria-label={t('chatOnWhatsApp', lang)}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline">{t('chatOnWhatsApp', lang)}</span>
    </motion.a>
  )
}

