import type { Metadata } from 'next'
import FullPageMap from '@/components/home/FullPageMap'
import { createServerClient } from '@/lib/supabase/server'
import type { SellerPin } from '@/components/home/LeafletMarketplaceMap'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ramani ya Soko',
  description: 'Tafuta maduka yaliyothibitishwa kwenye ramani halisi ya Zanzibar.',
}

async function getSellerPins(): Promise<SellerPin[]> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('sellers')
      .select('id, store_name, store_slug, logo_url, average_rating, location_label, latitude, longitude')
      .eq('status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    return ((data ?? []) as any[]).map((s) => ({
      id: s.id,
      store_name: s.store_name,
      store_slug: s.store_slug,
      logo_url: s.logo_url,
      average_rating: s.average_rating,
      location_label: s.location_label,
      latitude: s.latitude,
      longitude: s.longitude,
    }))
  } catch {
    return []
  }
}

export default async function MarketplaceMapPage() {
  const pins = await getSellerPins()
  return <FullPageMap pins={pins} />
}

