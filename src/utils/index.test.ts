import { describe, it, expect } from 'vitest'
import { formatTZS, slugify, DELIVERY_ZONES } from './index'

describe('utility functions', () => {
  describe('formatTZS', () => {
    it('formats zero correctly', () => {
      // Note: Intl.NumberFormat uses non-breaking space (\u00A0) between number and currency
      expect(formatTZS(0)).toBe('TSh\u00A00')
    })

    it('formats positive numbers correctly', () => {
      expect(formatTZS(1000)).toBe('TSh\u00A01,000')
      expect(formatTZS(1500000)).toBe('TSh\u00A01,500,000')
      // formatTZS rounds to nearest integer (no fraction digits)
      expect(formatTZS(1234567.89)).toBe('TSh\u00A01,234,568')
    })

    it('handles negative numbers', () => {
      // Negative numbers get the minus sign before the currency symbol
      expect(formatTZS(-500)).toBe('-TSh\u00A0500')
    })
  })

  describe('slugify', () => {
    it('converts to lowercase and replaces spaces with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('  Hello   World  ')).toBe('hello-world')
    })

    it('removes special characters', () => {
      expect(slugify('Hello@#$%World')).toBe('helloworld')
      expect(slugify('Café & Münchén')).toBe('caf-mnchn')
    })

    it('handles empty strings', () => {
      expect(slugify('')).toBe('')
    })
  })

  describe('DELIVERY_ZONES', () => {
    it('contains expected zones', () => {
      expect(DELIVERY_ZONES.stone_town).toEqual(
        expect.objectContaining({ nameEn: 'Stone Town', fee: 2000 })
      )
      expect(DELIVERY_ZONES.north_zanzibar).toEqual(
        expect.objectContaining({ nameEn: 'North Zanzibar', fee: 4000 })
      )
    })

    it('has correct number of zones', () => {
      const zones = Object.keys(DELIVERY_ZONES)
      expect(zones.length).toBe(6)
    })
  })
})

