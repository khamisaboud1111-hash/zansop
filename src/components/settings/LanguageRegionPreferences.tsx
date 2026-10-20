'use client'

import { useState, useEffect } from 'react'
import { Globe, MapPin, Languages, Clock } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils'
import toast from 'react-hot-toast'

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
]

const regions = [
  { code: 'tz', name: 'Tanzania', currency: 'TZS', timezone: 'Africa/Dar_es_Salaam' },
  { code: 'ke', name: 'Kenya', currency: 'KES', timezone: 'Africa/Nairobi' },
  { code: 'ug', name: 'Uganda', currency: 'UGX', timezone: 'Africa/Kampala' },
  { code: 'rw', name: 'Rwanda', currency: 'RWF', timezone: 'Africa/Kigali' },
  { code: 'bi', name: 'Burundi', currency: 'BIF', timezone: 'Africa/Bujumbura' }
]

export function LanguageRegionPreferences() {
  const { profile } = useUser()
  const { lang, setLang } = useLangStore()
  const [region, setRegion] = useState<string>('tz')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadPreferences()
  }, [profile])

  const loadPreferences = async () => {
    if (!profile) return
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('user_preferences')
        .select('language, region')
        .eq('user_id', profile.id)
        .maybeSingle()
      
      if (data) {
        if (data.language) setLang(data.language)
        if (data.region) setRegion(data.region)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = async (languageCode: string) => {
    setLang(languageCode)
    if (profile) {
      try {
        const supabase = createClient()
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: profile.id,
            language: languageCode,
            region,
            updated_at: new Date().toISOString()
          })
        toast.success(t('languageUpdated', lang))
      } catch (error) {
        toast.error('Failed to update language')
      }
    }
  }

  const handleRegionChange = async (regionCode: string) => {
    setRegion(regionCode)
    if (profile) {
      try {
        const supabase = createClient()
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: profile.id,
            language: lang,
            region: regionCode,
            updated_at: new Date().toISOString()
          })
        toast.success(t('regionUpdated', lang))
      } catch (error) {
        toast.error('Failed to update region')
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('languageRegion', lang)}</h3>
              <p className="text-sm text-muted-foreground">{t('manageLanguageRegion', lang)}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentLanguage = languages.find(l => l.code === lang) || languages[0]
  const currentRegion = regions.find(r => r.code === region) || regions[0]

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
      <div className="px-4 py-4 border-b border-ink-100 dark:border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('languageRegion', lang)}</h3>
            <p className="text-sm text-muted-foreground">{t('manageLanguageRegion', lang)}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-ink-100 dark:divide-ink-800">
        {/* Language Selection */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('language', lang)}</h4>
              <p className="text-sm text-muted-foreground">{t('selectPreferredLanguage', lang)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  'relative p-3 rounded-xl border-2 transition-all text-left',
                  lang === language.code
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 shadow-lg shadow-brand-500/10'
                    : 'border-ink-100 dark:border-ink-800 hover:border-brand-300 hover:bg-ink-50 dark:hover:bg-ink-800/50'
                )}
              >
                {lang === language.code && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
                <span className="text-2xl">{language.flag}</span>
                <div className="ml-2">
                  <p className="font-medium text-foreground">{language.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{language.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Region Selection */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('region', lang)}</h4>
              <p className="text-sm text-muted-foreground">{t('selectYourRegion', lang)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {regions.map((regionItem) => (
              <button
                key={regionItem.code}
                onClick={() => handleRegionChange(regionItem.code)}
                className={cn(
                  'relative p-3 rounded-xl border-2 transition-all text-left',
                  region === regionItem.code
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg shadow-emerald-500/10'
                    : 'border-ink-100 dark:border-ink-800 hover:border-green-300 hover:bg-ink-50 dark:hover:bg-ink-800/50'
                )}
              >
                {region === regionItem.code && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{regionItem.name}</p>
                    <p className="text-xs text-muted-foreground">{regionItem.currency} · {regionItem.timezone.replace('_', ' ')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

