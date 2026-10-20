'use client'

import { Mic, MicOff, Loader2, AlertCircle, HelpCircle } from 'lucide-react'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { useLangStore } from '@/store'
import { cn } from '@/utils'

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function VoiceSearchButton({ onTranscript, className, size = 'md' }: VoiceSearchButtonProps) {
  const { lang } = useLangStore()
  const { isListening, isSupported, startListening, stopListening, error, permissionDenied, permissionState } = useVoiceSearch({
    onResult: onTranscript,
  })

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        aria-label={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
        className={cn(
          'flex items-center justify-center rounded-xl border-2 bg-ink-100 dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-400 dark:text-ink-500 cursor-not-allowed opacity-50',
          'min-w-[44px] min-h-[44px]',
          sizeClasses[size],
          className
        )}
        title={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
      >
        <MicOff className="w-4 h-4" />
      </button>
    )
  }

  // Show permission denied state with clear instruction
  if (permissionDenied || permissionState === 'denied') {
    return (
      <button
        type="button"
        onClick={startListening} // Allow retry
        aria-label={lang === 'sw' ? 'Ruhusa ya sauti imekataliwa. Bonyeza kurejesha' : 'Microphone permission denied. Click to retry'}
        className={cn(
          'flex items-center justify-center rounded-xl border-2 transition-all',
          'min-w-[44px] min-h-[44px]',
          sizeClasses[size],
          className,
          'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50'
        )}
        title={lang === 'sw' 
          ? 'Ruhusa ya sauti imekataliwa. Bonyeza ikoni ya sauti kwenye anwani ya kivinjari kurekebisha, kisha bonyeza tena.' 
          : 'Microphone permission denied. Click the microphone icon in your browser address bar to allow access, then click again.'}
      >
        <AlertCircle className="w-4 h-4" />
      </button>
    )
  }

  // Show prompting state when permission is being requested
  const isPrompting = permissionState === 'prompt' || (permissionState === 'unknown' && !isListening && !error && !permissionDenied)

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      aria-label={isListening ? (lang === 'sw' ? 'Acha kusikiliza' : 'Stop listening') : (lang === 'sw' ? 'Tafuta kwa sauti' : 'Voice search')}
      aria-pressed={isListening}
      className={cn(
        'flex items-center justify-center rounded-xl border-2 transition-all',
        'min-w-[44px] min-h-[44px]', // WCAG touch target
        isListening
          ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/25'
          : error
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
            : isPrompting
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 animate-pulse'
              : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300 hover:text-brand-600',
        sizeClasses[size],
        className
      )}
      title={error || isPrompting 
        ? (lang === 'sw' ? 'Inaomba ruhusa ya sauti...' : 'Requesting microphone permission...')
        : undefined}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : error ? <AlertCircle className="w-4 h-4" /> : isPrompting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}

// Inline variant for search bar
export function VoiceSearchInline({ onTranscript, className }: { onTranscript: (text: string) => void; className?: string }) {
  const { lang } = useLangStore()
  const { isListening, isSupported, startListening, stopListening, error, permissionDenied, permissionState } = useVoiceSearch({
    onResult: onTranscript,
  })

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        aria-label={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
        className={cn(
          'p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
          'bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-500 cursor-not-allowed opacity-50',
          className
        )}
        title={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
      >
        <MicOff className="w-4 h-4" />
      </button>
    )
  }

  if (permissionDenied || permissionState === 'denied') {
    return (
      <button
        type="button"
        onClick={startListening}
        aria-label={lang === 'sw' ? 'Ruhusa ya sauti imekataliwa. Bonyeza kurejesha' : 'Microphone permission denied. Click to retry'}
        className={cn(
          'p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
          'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50',
          className
        )}
        title={lang === 'sw' 
          ? 'Ruhusa ya sauti imekataliwa. Bonyeza ikoni ya sauti kwenye anwani ya kivinjari kurekebisha, kisha bonyeza tena.' 
          : 'Microphone permission denied. Click the microphone icon in your browser address bar to allow access, then click again.'}
      >
        <AlertCircle className="w-4 h-4" />
      </button>
    )
  }

  const isPrompting = permissionState === 'prompt' || (permissionState === 'unknown' && !isListening && !error && !permissionDenied)

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={cn(
        'p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
        isListening ? 'bg-red-50 dark:bg-red-950/30 text-red-600 animate-pulse' 
          : error ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600' 
          : isPrompting ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 animate-pulse' 
          : 'text-ink-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20',
        className
      )}
      aria-label={lang === 'sw' ? 'Sauti' : 'Voice'}
      title={error || isPrompting 
        ? (lang === 'sw' ? 'Inaomba ruhusa ya sauti...' : 'Requesting microphone permission...')
        : undefined}
    >
      {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : error ? <AlertCircle className="w-4 h-4" /> : isPrompting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}

