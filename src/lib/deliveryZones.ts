import { createClient } from '@/lib/supabase/client'
import type { DeliveryZone } from '@/types'

interface DeliveryZoneConfig {
  zone: DeliveryZone
  name_en: string
  name_sw: string
  fee: number
  estimated_days: number
}

let cachedZones: DeliveryZoneConfig[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getDeliveryZones(): Promise<DeliveryZoneConfig[]> {
  // Return cached if valid
  if (cachedZones && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedZones
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('zone, name_en, name_sw, fee, estimated_days')
    .order('fee', { ascending: true })

  if (error) {
    console.error('Failed to fetch delivery zones:', error)
    // Fallback to hardcoded defaults if DB unavailable
    return getDefaultDeliveryZones()
  }

  cachedZones = data as DeliveryZoneConfig[]
  cacheTimestamp = Date.now()
  return cachedZones
}

export async function getDeliveryFee(zone: string): Promise<number> {
  const zones = await getDeliveryZones()
  const zoneConfig = zones.find(z => z.zone === zone)
  return zoneConfig?.fee ?? 0
}

export async function getDeliveryDays(zone: string): Promise<number> {
  const zones = await getDeliveryZones()
  const zoneConfig = zones.find(z => z.zone === zone)
  return zoneConfig?.estimated_days ?? 1
}

export function getDeliveryZoneInfo(zone: string): { nameEn: string; nameSw: string; fee: number; days: number } | null {
  const zones = getDefaultDeliveryZones()
  const zoneConfig = zones.find(z => z.zone === zone)
  if (!zoneConfig) return null
  return {
    nameEn: zoneConfig.name_en,
    nameSw: zoneConfig.name_sw,
    fee: zoneConfig.fee,
    days: zoneConfig.estimated_days,
  }
}

// Fallback defaults (used if DB unavailable)
export function getDefaultDeliveryZones(): DeliveryZoneConfig[] {
  return [
    { zone: 'stone_town',     name_en: 'Stone Town',     name_sw: 'Stone Town (Mji Mkongwe)', fee: 2000,  estimated_days: 1 },
    { zone: 'north_zanzibar', name_en: 'North Zanzibar', name_sw: 'Kaskazini Unguja',         fee: 4000,  estimated_days: 1 },
    { zone: 'south_zanzibar', name_en: 'South Zanzibar', name_sw: 'Kusini Unguja',            fee: 4000,  estimated_days: 1 },
    { zone: 'east_zanzibar',  name_en: 'East Zanzibar',  name_sw: 'Mashariki Unguja',         fee: 5000,  estimated_days: 2 },
    { zone: 'west_zanzibar',  name_en: 'West Zanzibar',  name_sw: 'Magharibi Unguja',         fee: 3500,  estimated_days: 1 },
    { zone: 'pemba_island',   name_en: 'Pemba Island',   name_sw: 'Kisiwa cha Pemba',         fee: 15000, estimated_days: 3 },
  ]
}

export function formatZoneName(zone: string, lang: 'en' | 'sw' = 'sw'): string {
  const info = getDeliveryZoneInfo(zone)
  if (!info) return zone
  return lang === 'sw' ? info.nameSw : info.nameEn
}

export function invalidateDeliveryZoneCache() {
  cachedZones = null
  cacheTimestamp = 0
}

