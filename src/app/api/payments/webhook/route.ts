import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('verif-hash')

  if (!signature) {
    console.warn('[payments/webhook] rejected: missing verif-hash')
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  // Validate webhook signature using FLUTTERWAVE_SECRET_HASH
  const expectedHash = process.env.FLUTTERWAVE_SECRET_HASH
  if (!expectedHash || signature !== expectedHash) {
    console.warn('[payments/webhook] rejected: invalid verif-hash')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const provider = 'flutterwave'
  const transactionId = body?.data?.id
  const providerReference = body?.data?.tx_ref
  const status = body?.data?.status
  const amount = body?.data?.amount
  const currency = body?.data?.currency ?? 'TZS'

  if (!transactionId || !providerReference) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Call the atomic database function to process the webhook
  const { data, error } = await supabase.rpc('process_payment_webhook', {
    p_provider: 'flutterwave',
    p_provider_reference: body.data.tx_ref,
    p_transaction_id: String(transactionId),
    p_status: body.data.status,
    p_amount: body.data.amount,
    p_currency: body.data.currency ?? 'TZS',
    p_raw_payload: body,
  })

  if (error) {
    console.error('[payments/webhook] RPC error:', error)
    // Return success to prevent webhook retries for non-retryable errors
    return NextResponse.json({ success: true, error: error.message })
  }

  return NextResponse.json(data ?? { success: true })
}

