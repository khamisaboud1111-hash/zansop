export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'

const mobileMoneySchema = z.object({
  order_id: z.string().uuid(),
  phone_number: z.string().min(10).max(15),
  provider: z.enum(['mpesa', 'tigo_pesa', 'airtel_money', 'halopesa']),
})

export const POST = withValidation(mobileMoneySchema, async (data) => {
  const supabase = createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: 'Hujaingia (not authenticated)' }, { status: 401 })
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, buyer_id, total_amount, payment_confirmed')
    .eq('id', data.order_id)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Agizo halipo' }, { status: 404 })
  }

  if (order.buyer_id !== auth.user.id) {
    return NextResponse.json({ error: 'Hauruhusiwi' }, { status: 403 })
  }

  if (order.payment_confirmed) {
    return NextResponse.json({ error: 'Agizo hili limelipiwa tayari' }, { status: 409 })
  }

  const { error: txnErr } = await supabase.from('payment_transactions').insert({
    order_id: order.id,
    provider: data.provider,
    provider_reference: `pending-${Date.now()}`,
    amount: order.total_amount,
    phone_number: data.phone_number,
    status: 'pending',
  })

  if (txnErr) {
    return NextResponse.json({ error: 'Imeshindikana kuanzisha malipo' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Ombi la limewekwa. Utaagizwa kuthibitisha malipo kwenye simu yako.',
  })
})

