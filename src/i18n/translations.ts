import { en, type TranslationKey } from './dictionaries/en'
import { sw } from './dictionaries/sw'
import { ar } from './dictionaries/ar'
import { fr } from './dictionaries/fr'

export type Language = 'en' | 'sw' | 'ar' | 'fr'

export const translations = { en, sw, ar, fr } as const

export type { TranslationKey }

export function t(key: TranslationKey | (string & {}), lang?: Language | null): string {
  // Guard the lookup: an unknown/undefined language used to throw
  // "Cannot read properties of undefined" and white-screen the whole page.
  const dict = (lang && translations[lang]) || translations.en
  return (dict as Record<string, string | undefined>)[key] ?? key
}

