export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const POST = withValidation(updateLocationSchema, async (data) => {
  const supabase = createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: 'Hujaingia (not authenticated)' }, { status: 401 })
  }

  const point = `POINT(${data.lng} ${data.lat})`

  const { error } = await supabase
    .from('rider_profiles')
    .update({
      current_location: point,
      location_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.user.id)

  if (error) {
    console.error('[rider/location] update error:', error)
    return NextResponse.json({ error: 'Imeshindikana kusasisha eneo (location update failed)' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})

