import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * A rider asks to be paid out.
 *
 * The request used to be a row in rider_withdrawals and nothing else: the
 * money never left the wallet, because rider_transactions has no insert
 * policy for riders, and the balance is the sum of that table. The same
 * amount could be requested over and over.
 *
 * The money now leaves the balance here, as a 'withdrawal' entry in the
 * ledger, and the request is recorded next to it.
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
  const method = body.method || 'mpesa'

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Weka kiasi kinachofaa' }, { status: 400 })
  }
  if (accountNumber.length < 6) {
    return NextResponse.json({ error: 'Namba ya simu si sahihi' }, { status: 400 })
  }

  const { data: transactions, error: txError } = await supabase
    .from('rider_transactions')
    .select('amount')
    .eq('rider_id', user.id)

  if (txError) {
    console.error('[rider/wallet/withdraw] could not read the ledger:', txError)
    return NextResponse.json({ error: 'Imeshindikana kuangalia salio' }, { status: 500 })
  }

  const balance = (transactions ?? []).reduce((sum, row: any) => sum + (row.amount ?? 0), 0)

  if (amount > balance) {
    return NextResponse.json(
      { error: 'Kiasi kinazidi salio la pochi yako' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // The ledger entry is what actually moves the balance.
  const { error: ledgerErr } = await admin.from('rider_transactions').insert({
    rider_id: user.id,
    type: 'withdrawal',
    amount: -amount,
    description: `Withdrawal to ${method} ${accountNumber}`,
  })
  if (ledgerErr) {
    console.error('[rider/wallet/withdraw] ledger insert failed:', ledgerErr)
    return NextResponse.json({ error: 'Imeshindikana kuandika muamala' }, { status: 500 })
  }

  const { error: withdrawalErr } = await admin.from('rider_withdrawals').insert({
    rider_id: user.id,
    amount,
    status: 'pending',
    method,
    account_number: accountNumber,
  })
  if (withdrawalErr) {
    console.error('[rider/wallet/withdraw] withdrawal insert failed:', withdrawalErr)
    return NextResponse.json({ error: 'Imeshindikana kuwasilisha ombi' }, { status: 500 })
  }

  return NextResponse.json({ success: true, balance: balance - amount })
}
