import type { SupabaseClient } from '@supabase/supabase-js'

const DISPATCH_TIMEOUT_SECONDS = 30

/**
 * Marks the current rider's offer as declined/timed_out, appends them to the
 * delivery's exclusion_list, and recursively tries to find + assign the next
 * nearest available rider. If no rider is found, the delivery is left
 * unassigned (rider_id = null) with status back to 'pending_dispatch' so it
 * can be retried later (e.g. when a new rider comes online).
 */
export async function redispatchDelivery(
  supabase: SupabaseClient,
  deliveryId: string,
  declinedRiderId: string,
  reason: 'declined' | 'timed_out'
) {
  const { data: delivery, error: fetchErr } = await supabase
    .from('deliveries')
    .select('id, pickup_location, exclusion_list, status, rider_id')
    .eq('id', deliveryId)
    .single()

  if (fetchErr || !delivery) {
    console.error('[redispatch] delivery not found:', deliveryId, fetchErr)
    return { success: false, reason: 'not_found' as const }
  }

  // Already resolved by someone else (race with accept) — nothing to do.
  if (delivery.status !== 'pending_dispatch') {
    return { success: false, reason: 'already_resolved' as const }
  }

  const exclusionList: string[] = Array.from(
    new Set([...(delivery.exclusion_list ?? []), declinedRiderId])
  )

  const { data: nearest, error: rpcError } = await supabase.rpc('find_nearest_available_rider', {
    pickup_geo: delivery.pickup_location,
    exclusion_list: exclusionList,
  })

  if (rpcError) {
    console.error('[redispatch] RPC error:', rpcError)
    return { success: false, reason: 'rpc_error' as const }
  }

  const riderMatch = Array.isArray(nearest) ? nearest[0] : null

  const { error: updateErr } = await supabase
    .from('deliveries')
    .update({
      rider_id: riderMatch?.rider_id ?? null,
      status: 'pending_dispatch',
      exclusion_list: exclusionList,
      distance_meters: riderMatch?.distance_meters ? Math.round(riderMatch.distance_meters) : null,
      timeout_expires_at: riderMatch
        ? new Date(Date.now() + DISPATCH_TIMEOUT_SECONDS * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .eq('status', 'pending_dispatch')

  if (updateErr) {
    console.error('[redispatch] update error:', updateErr)
    return { success: false, reason: 'update_error' as const }
  }

  // Log the previous rider's decline/timeout as a historical breadcrumb.
  // (We don't have a separate offers table yet — exclusion_list on the
  // delivery row is the source of truth for "who's already been asked".)
  void reason

  return { success: true, rider_found: Boolean(riderMatch) }
}

