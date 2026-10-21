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

  // An order can only have one live delivery. Pressing "find rider" again
  // on an order that already has an open delivery used to insert a second
  // one, which put a duplicate job on the rider board and left the seller
  // with two deliveries for the same order. Reuse the open delivery instead
  // and just retry the rider lookup.
  const { data: existing, error: existingErr } = await supabase
    .from('deliveries')
    .select('*')
    .eq('order_id', data.order_id)
    .in('status', ['pending_dispatch', 'accepted', 'picked_up'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingErr) {
    console.error('[dispatch] existing lookup error:', existingErr)
  }

  const openDelivery = existing && existing.length > 0 ? existing[0] : null

  if (openDelivery) {
    // Still waiting for a rider: try to assign one now.
    if (!openDelivery.rider_id) {
      const { data: nearest, error: rpcError } = await supabase.rpc('find_nearest_available_rider', {
        pickup_geo: pickupGeo,
        exclusion_list: [],
      })

      if (!rpcError) {
        const riderMatch = Array.isArray(nearest) ? nearest[0] : null
        if (riderMatch) {
          const { data: claimed } = await supabase
            .from('deliveries')
            .update({
              rider_id: riderMatch.rider_id,
              distance_meters: riderMatch.distance_meters
                ? Math.round(riderMatch.distance_meters)
                : null,
              timeout_expires_at: new Date(
                Date.now() + DISPATCH_TIMEOUT_SECONDS * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', openDelivery.id)
            .is('rider_id', null)
            .select()
            .maybeSingle()

          return NextResponse.json({
            delivery: claimed ?? openDelivery,
            rider_found: Boolean(claimed),
            timeout_seconds: claimed ? DISPATCH_TIMEOUT_SECONDS : null,
            reused: true,
          })
        }
      }
    }

    return NextResponse.json({
      delivery: openDelivery,
      rider_found: Boolean(openDelivery.rider_id),
      timeout_seconds: openDelivery.rider_id ? DISPATCH_TIMEOUT_SECONDS : null,
      reused: true,
    })
  }

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

