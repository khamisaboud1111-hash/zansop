export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPaymentAdapter } from '@/lib/payments'
import { PaymentProvider } from '@/types'

interface InitiateBody {
  order_id: string
  provider: PaymentProvider
  phone_number: string
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: InitiateBody = await req.json()

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, total_amount, payment_confirmed')
    .eq('id', body.order_id)
    .single()

  if (!order || order.buyer_id !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.payment_confirmed) {
    return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
  }

  // Cash on delivery needs no provider call ΓÇö just record intent
  if (body.provider === 'cash_on_delivery') {
    const { data: txn } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        provider: 'cash_on_delivery',
        status: 'pending',
        amount: order.total_amount,
        phone_number: body.phone_number,
      })
      .select()
      .single()
    return NextResponse.json({ data: txn, error: null })
  }

  const adapter = getPaymentAdapter(body.provider)
  if (!adapter) {
    return NextResponse.json({ error: `Unsupported payment provider: ${body.provider}` }, { status: 400 })
  }

  const result = await adapter.initiate({
    orderId: order.id,
    amount: order.total_amount,
    phoneNumber: body.phone_number,
    provider: body.provider,
  })

  const { data: txn, error: txnError } = await supabase
    .from('payment_transactions')
    .insert({
      order_id: order.id,
      provider: body.provider,
      status: result.status,
      amount: order.total_amount,
      phone_number: body.phone_number,
      provider_reference: result.providerReference ?? null,
      failure_reason: result.success ? null : result.message ?? null,
    })
    .select()
    .single()

  if (txnError) return NextResponse.json({ error: txnError.message }, { status: 400 })

  if (!result.success) {
    return NextResponse.json({ data: txn, error: result.message ?? 'Payment could not be started' }, { status: 422 })
  }

  return NextResponse.json({ data: txn, error: null })
}

