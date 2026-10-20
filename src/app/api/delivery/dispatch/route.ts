export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'
import { readyForPickupSchema } from '@/lib/validation/rider'

const DISPATCH_TIMEOUT_SECONDS = 30

export const POST = withValidation(readyForPickupSchema, async (data) => {
  const supabase = createServerClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: 'Hujaingia (not authenticated)' }, { status: 401 })
  }

  // Confirm the caller actually owns this seller account.
  const { data: seller, error: sellerErr } = await supabase
    .from('sellers')
    .select('id, user_id')
    .eq('id', data.seller_id)
    .single()

  if (sellerErr || !seller || seller.user_id !== auth.user.id) {
    return NextResponse.json({ error: 'Hauruhusiwi kutuma duka hili (forbidden)' }, { status: 403 })
  }

  const pickupGeo = `POINT(${data.pickup_lng} ${data.pickup_lat})`

  // 1. Find nearest available rider via the PostGIS RPC from Phase 8.
  const { data: nearest, error: rpcError } = await supabase.rpc('find_nearest_available_rider', {
    pickup_geo: pickupGeo,
    exclusion_list: [],
  })

  if (rpcError) {
    console.error('[dispatch] RPC error:', rpcError)
    return NextResponse.json({ error: 'Imeshindikana kupata dereva (dispatch lookup failed)' }, { status: 500 })
  }

  const riderMatch = Array.isArray(nearest) ? nearest[0] : null

  const deliveryLocation =
    data.delivery_lat !== undefined && data.delivery_lng !== undefined
      ? `POINT(${data.delivery_lng} ${data.delivery_lat})`
      : null

  // 2. Insert the delivery row regardless of whether a rider was found ΓÇö
  //    if none is found yet, it stays unassigned and re-dispatch will retry
  //    when a rider comes online (handled by the timeout-check route).
  const timeoutExpiresAt = riderMatch
    ? new Date(Date.now() + DISPATCH_TIMEOUT_SECONDS * 1000).toISOString()
    : null

  const { data: delivery, error: insertError } = await supabase
    .from('deliveries')
    .insert({
      order_id: data.order_id,
      seller_id: data.seller_id,
      rider_id: riderMatch?.rider_id ?? null,
      status: 'pending_dispatch',
      pickup_location: pickupGeo,
      pickup_address: data.pickup_address,
      delivery_location: deliveryLocation,
      delivery_address: data.delivery_address,
      delivery_fee: data.delivery_fee,
      distance_meters: riderMatch?.distance_meters ? Math.round(riderMatch.distance_meters) : null,
      timeout_expires_at: timeoutExpiresAt,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[dispatch] insert error:', insertError)
    return NextResponse.json({ error: 'Imeshindikana kuunda usafirishaji (could not create delivery)' }, { status: 500 })
  }

  return NextResponse.json({
    delivery,
    rider_found: Boolean(riderMatch),
    timeout_seconds: riderMatch ? DISPATCH_TIMEOUT_SECONDS : null,
  })
})

