export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPaymentAdapter } from '@/lib/payments'
import { PaymentProvider } from '@/types'
import { z } from 'zod'

const CheckoutBodySchema = z.object({
  order_id: z.string().uuid(),
  provider: z.enum(['mpesa', 'airtel_money', 'tigo_pesa', 'cash_on_delivery', 'flutterwave']),
  phone_number: z.string().min(10).max(15),
})

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = CheckoutBodySchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parseResult.error.flatten() },
      { status: 400 }
    )
  }

  const { order_id, provider, phone_number } = parseResult.data

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, buyer_id, total_amount, payment_confirmed, delivery_fee, commission_amount')
    .eq('id', order_id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.payment_confirmed) {
    return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
  }

  // Cash on delivery needs no provider call ΓÇö just record intent
  if (provider === 'cash_on_delivery') {
    const { data: txn, error: txnError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        provider: 'cash_on_delivery',
        status: 'pending',
        amount: order.total_amount,
        phone_number,
      })
      .select()
      .single()

    if (txnError) {
      return NextResponse.json({ error: txnError.message }, { status: 400 })
    }

    return NextResponse.json({ data: txn, error: null })
  }

  const adapter = getPaymentAdapter(provider)
  if (!adapter) {
    return NextResponse.json(
      { error: `Unsupported payment provider: ${provider}` },
      { status: 400 }
    )
  }

  // Use authoritative order total from database
  const amount = order.total_amount

  const result = await adapter.initiate({
    orderId: order.id,
    amount,
    phoneNumber: phone_number,
    provider,
  })

  const { data: txn, error: txnError } = await supabase
    .from('payment_transactions')
    .insert({
      order_id: order.id,
      provider,
      status: result.status,
      amount,
      phone_number,
      provider_reference: result.providerReference ?? null,
      failure_reason: result.success ? null : result.message ?? null,
    })
    .select()
    .single()

  if (txnError) {
    return NextResponse.json({ error: txnError.message }, { status: 400 })
  }

  if (!result.success) {
    return NextResponse.json(
      { data: txn, error: result.message ?? 'Payment could not be started' },
      { status: 422 }
    )
  }

  return NextResponse.json({ data: txn, error: null })
}

