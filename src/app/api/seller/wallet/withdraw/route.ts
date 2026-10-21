import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * A seller asks to be paid out. The money leaves the wallet as soon as the
 * request is made - the request itself is the promise to pay, and leaving
 * the balance untouched would let a seller ask for the same money twice.
 */
export async function POST(request: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Hujaingia (not authenticated)' }, { status: 401 })
  }

  let body: { amount?: number; account_number?: string; method?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const amount = Math.floor(Number(body.amount))
  const accountNumber = (body.account_number ?? '').trim()
  const method = body.method ?? 'mpesa'

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Weka kiasi kinachofaa' }, { status: 400 })
  }
  if (accountNumber.length < 6) {
    return NextResponse.json({ error: 'Namba ya simu si sahihi' }, { status: 400 })
  }

  const { data: seller, error: sellerErr } = await supabase
    .from('sellers')
    .select('id, wallet_balance')
    .eq('user_id', user.id)
    .single()

  if (sellerErr || !seller) {
    return NextResponse.json({ error: 'Duka halijapatikana' }, { status: 404 })
  }

  if (amount > (seller.wallet_balance ?? 0)) {
    return NextResponse.json(
      { error: 'Kiasi kinazidi salio la pochi yako' },
      { status: 400 }
    )
  }

  // The admin client writes the ledger row, because the seller has no
  // INSERT policy on the wallet table - only the server moves money.
  const admin = createAdminClient()

  const { error: ledgerErr } = await admin.from('seller_wallet_transactions').insert({
    seller_id: seller.id,
    type: 'withdrawal',
    amount: -amount,
    description: `Withdrawal to ${method} ${accountNumber}`,
  })
  if (ledgerErr) {
    console.error('[seller/wallet/withdraw] ledger insert failed:', ledgerErr)
    return NextResponse.json({ error: 'Imeshindikana kuandika muamala' }, { status: 500 })
  }

  const { error: withdrawalErr } = await admin.from('seller_withdrawals').insert({
    seller_id: seller.id,
    amount,
    method,
    account_number: accountNumber,
  })
  if (withdrawalErr) {
    console.error('[seller/wallet/withdraw] withdrawal insert failed:', withdrawalErr)
    return NextResponse.json({ error: 'Imeshindikana kuwasilisha ombi' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
