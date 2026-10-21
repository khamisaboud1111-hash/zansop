export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // On delivery completion, record the earning in the ledger. The wallet
  // balance and the delivery count are maintained by a trigger on
  // rider_transactions, so they always match the ledger.
  //
  // The insert runs as the service role on purpose: riders have no INSERT
  // policy on rider_transactions, so the only way money reaches the ledger
  // is through this route, which has already checked that the delivery
  // belongs to the caller. Letting riders write their own ledger rows would
  // let them credit themselves any amount.
  if (data.status === 'delivered') {
    const { data: deliveryRow, error: deliveryErr } = await supabase
      .from('deliveries')
      .select('id, delivery_fee, rider_id')
      .eq('id', data.delivery_id)
      .single()

    if (deliveryErr || !deliveryRow) {
      console.error('[delivery/update-status] could not read delivery for ledger:', deliveryErr)
    } else {
      const admin = createAdminClient()

      // One earning per delivery, even if the request is replayed.
      const { data: existing } = await admin
        .from('rider_transactions')
        .select('id')
        .eq('delivery_id', deliveryRow.id)
        .eq('type', 'earning')
        .limit(1)

      if (!existing || existing.length === 0) {
        const { error: ledgerErr } = await admin.from('rider_transactions').insert({
          rider_id: deliveryRow.rider_id,
          type: 'earning',
          amount: deliveryRow.delivery_fee,
          description: 'Delivery completed',
          delivery_id: deliveryRow.id,
        })

        if (ledgerErr) {
          console.error('[delivery/update-status] ledger insert failed:', ledgerErr)
        }
      }
    }
  }

  return NextResponse.json({ success: true })
})

