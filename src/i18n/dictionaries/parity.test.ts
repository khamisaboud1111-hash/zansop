import { describe, it, expect } from 'vitest'
import { en } from './en'
import { sw } from './sw'
import { ar } from './ar'
import { fr } from './fr'

/**
 * i18n parity guard.
 *
 * All four locale dictionaries (en/sw/ar/fr) must expose the SAME set of
 * leaf keys. A key added to one locale but not another silently falls back
 * to `translations.en[key]` (via `t()`), masking missing translations for
 * Swahili/Arabic/French speakers. This test fails on any discrepancy so the
 * drift is caught at CI time instead of in production.
 */
function collectLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return collectLeafKeys(value as Record<string, unknown>, path)
    }
    return [path]
  })
}

describe('i18n dictionaries are in sync across locales', () => {
  const locales = [
    { name: 'sw', dict: sw },
    { name: 'ar', dict: ar },
    { name: 'fr', dict: fr },
  ]

  const enKeys = collectLeafKeys(en)

  for (const { name, dict } of locales) {
    it(`${name} has exactly the same keys as en`, () => {
      const keys = collectLeafKeys(dict)
      expect(keys.sort()).toEqual(enKeys.sort())
    })
  }
})

