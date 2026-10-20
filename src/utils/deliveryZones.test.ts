import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DELIVERY_ZONES } from './index'

/**
 * Single-source-of-truth guard for delivery zones.
 *
 * Zone fees/names/days live in TWO places that must never drift:
 *   1. src/utils/index.ts  �+' DELIVERY_ZONES (used for client-side checkout math)
 *   2. supabase/migrations/001_initial_schema.sql �+' delivery_zones seed (source of truth in DB)
 *
 * This test parses the SQL seed rows and asserts they match the TS constant
 * exactly, so a change in one place without the other fails CI.
 */
function parseSqlZoneRows(): Array<{ zone: string; nameEn: string; nameSw: string; fee: number; estimated_days: number }> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const migrationPath = resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql')
  const sql = readFileSync(migrationPath, 'utf8')

  // Each row: ('zone_key', 'Name EN', 'Name SW', 2000,  1),
  // Match all rows directly from the full SQL
  const rowPattern = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g
  const matches = [...sql.matchAll(rowPattern)]
  
  if (matches.length === 0) throw new Error('No delivery_zones rows parsed from migration')
  
  const rows = matches.map((m) => ({
    zone: m[1],
    nameEn: m[2],
    nameSw: m[3],
    fee: Number(m[4]),
    estimated_days: Number(m[5]),
  }))

  return rows
}

describe('DELIVERY_ZONES stays in sync with the database migration', () => {
  const sqlZones = parseSqlZoneRows()

  it('finds the same zone keys in SQL and TS', () => {
    const sqlKeys = sqlZones.map((z) => z.zone).sort()
    const tsKeys = Object.keys(DELIVERY_ZONES).sort()
    expect(sqlKeys).toEqual(tsKeys)
  })

  it('matches name_en, name_sw, fee, and estimated_days for every zone', () => {
    for (const sqlRow of sqlZones) {
      const tsRow = DELIVERY_ZONES[sqlRow.zone as keyof typeof DELIVERY_ZONES]
      expect(tsRow, `zone ${sqlRow.zone} missing from DELIVERY_ZONES`).toBeDefined()
      expect(tsRow.nameEn).toBe(sqlRow.nameEn)
      expect(tsRow.nameSw).toBe(sqlRow.nameSw)
      expect(tsRow.fee).toBe(sqlRow.fee)
      expect(tsRow.estimated_days).toBe(sqlRow.estimated_days)
    }
  })
})

