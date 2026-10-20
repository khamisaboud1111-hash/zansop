'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLangStore } from '@/store'

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : unknown

interface VoiceSearchOptions {
  onResult: (transcript: string) => void
  lang?: string
}

export function useVoiceSearch({ onResult, lang }: VoiceSearchOptions) {
  const storeLang = useLangStore((s) => s.lang)
  const displayLang = lang || storeLang
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [permissionState, setPermissionState] = useState<PermissionState | 'unknown'>('unknown')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognitionCtor = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition as unknown as new () => unknown

    const supported = !!SpeechRecognitionCtor
    setIsSupported(supported)

    if (!supported) return

    const recognition = new (SpeechRecognitionCtor as unknown as new () => unknown)() as unknown as { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; onresult: (e: unknown) => void; onerror: (e: { error: string }) => void; onend: () => void; start: () => void; stop: () => void; abort: () => void }
    // Use Swahili locale if available, fallback to en
    const locale = displayLang === 'sw' ? 'sw-TZ' : displayLang === 'ar' ? 'ar-SA' : displayLang === 'fr' ? 'fr-FR' : 'en-US'
    ;(recognition as unknown as { lang: string }).lang = locale
    ;(recognition as unknown as { continuous: boolean }).continuous = false
    ;(recognition as unknown as { interimResults: boolean }).interimResults = false
    ;(recognition as unknown as { maxAlternatives: number }).maxAlternatives = 1

    recognition.onresult = (event: unknown) => {
      const e = event as { results: Array<Array<{ transcript: string }>> }
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) onResult(transcript)
      setIsListening(false)
    }

    recognition.onerror = (e: { error: string }) => {
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        setPermissionDenied(true)
        setPermissionState('denied')
        setError('Microphone permission denied. Please allow microphone access in browser settings.')
      } else if (e.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else if (e.error === 'language-not-supported') {
        // Fallback to en-US if locale not supported
        ;(recognition as unknown as { lang: string }).lang = 'en-US'
        try { recognition.start() } catch {}
      } else {
        setError(`Voice recognition error: ${e.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition

    return () => {
      try { recognitionRef.current?.abort() } catch {}
    }
  }, [onResult, displayLang])

  // Check microphone permission state on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        setPermissionState(result.state)
        result.onchange = () => setPermissionState(result.state)
      }).catch(() => setPermissionState('unknown'))
    }
  }, [])

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListening) return
    
    setError(null)
    setPermissionDenied(false)
    
    try {
      // Request microphone permission first - this triggers browser prompt
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          setPermissionState('granted')
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionDenied(true)
            setPermissionState('denied')
            setError('Microphone access denied. Please click the microphone icon in your browser address bar to allow access, then try again.')
            return
          } else if (err.name === 'NotFoundError') {
            setError('No microphone found. Please connect a microphone and try again.')
            return
          } else if (err.name === 'NotReadableError') {
            setError('Microphone is in use by another application. Please close other apps using the microphone and try again.')
            return
          }
          // For other errors, still try to start recognition
        }
      }
      
      ;(recognitionRef.current as unknown as { start: () => void }).start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    try { (recognitionRef.current as unknown as { stop: () => void })?.stop() } catch {}
    setIsListening(false)
  }, [])

  return { isListening, isSupported, startListening, stopListening, error, permissionDenied, permissionState }
}

