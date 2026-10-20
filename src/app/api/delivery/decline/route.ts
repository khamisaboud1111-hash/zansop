export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'
import { declineDeliverySchema } from '@/lib/validation/rider'
import { redispatchDelivery } from '@/lib/dispatch/redispatch'

export const POST = withValidation(declineDeliverySchema, async (data) => {
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
    return NextResponse.json({ error: 'Usafirishaji huu haukutolewa kwako' }, { status: 403 })
  }

  if (delivery.status !== 'pending_dispatch') {
    return NextResponse.json({ error: 'Tayari imeshughulikiwa' }, { status: 409 })
  }

  const result = await redispatchDelivery(supabase, data.delivery_id, auth.user.id, 'declined')
  return NextResponse.json(result)
})

