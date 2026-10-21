export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'
import { updateDeliveryStatusSchema } from '@/lib/validation/rider'

export const POST = withValidation(updateDeliveryStatusSchema, async (data) => {
  const supabase = createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: 'Hujaingia (not authenticated)' }, { status: 401 })
  }

  const { data: delivery, error: fetchErr } = await supabase
    .from('deliveries')
    .select('id, rider_id, status')
    .eq('id', data.delivery_id)
    .single()

  if (fetchErr || !delivery) {
    return NextResponse.json({ error: 'Usafirishaji haupo' }, { status: 404 })
  }

  if (delivery.rider_id !== auth.user.id) {
    return NextResponse.json({ error: 'Hauruhusiwi' }, { status: 403 })
  }

  const allowedTransition =
    (delivery.status === 'accepted' && data.status === 'picked_up') ||
    (delivery.status === 'picked_up' && data.status === 'delivered')

  if (!allowedTransition) {
    return NextResponse.json({ error: 'Mpito wa hali si sahihi (invalid status transition)' }, { status: 409 })
  }

  const timestampField = data.status === 'picked_up' ? 'picked_up_at' : 'delivered_at'

  const { error: updateErr } = await supabase
    .from('deliveries')
    .update({ status: data.status, [timestampField]: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', data.delivery_id)

  if (updateErr) {
    console.error('[delivery/update-status] error:', updateErr)
    return NextResponse.json({ error: 'Imeshindikana kusasisha (update failed)' }, { status: 500 })
  }

  // On delivery completion, bump the rider's lifetime delivery count and
  // credit their wallet with the delivery fee.
  if (data.status === 'delivered') {
    const { data: deliveryRow } = await supabase
      .from('deliveries')
      .select('id, delivery_fee, rider_id')
      .eq('id', data.delivery_id)
      .single()

    if (deliveryRow) {
      const { data: rider } = await supabase
        .from('rider_profiles')
        .select('wallet_balance, total_deliveries')
        .eq('id', deliveryRow.rider_id)
        .single()

      if (rider) {
        await supabase
          .from('rider_profiles')
          .update({
            wallet_balance: rider.wallet_balance + deliveryRow.delivery_fee,
            total_deliveries: rider.total_deliveries + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', deliveryRow.rider_id)

        // Ledger entry, so the wallet page shows where the balance came from.
        // The balance is credited here, so the transaction has to be written
        // here too.
        await supabase
          .from('rider_transactions')
          .insert({
            rider_id: deliveryRow.rider_id,
            type: 'earning',
            amount: deliveryRow.delivery_fee,
            description: 'Delivery completed',
            delivery_id: deliveryRow.id ?? data.delivery_id,
          })
      }
    }
  }

  return NextResponse.json({ success: true })
})

