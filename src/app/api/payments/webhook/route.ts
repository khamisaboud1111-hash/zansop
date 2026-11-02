import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/payments/aggregator';
import { createAdminClient } from '@/lib/supabase/admin';

const SUCCESSFUL_STATUSES = ['successful', 'completed'];

type FlutterwaveWebhookPayload = {
  data?: {
    id?: string | number;
  };
} | null;

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    if (!secretHash || signature !== secretHash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: FlutterwaveWebhookPayload = null;

    try {
      payload = (await req.json()) as FlutterwaveWebhookPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const rawId = payload?.data?.id;

    if (rawId === undefined || rawId === null || rawId === '') {
      return NextResponse.json(
        { error: 'Missing transaction id' },
        { status: 400 }
      );
    }

    const transactionId = String(rawId);
    const verification = await verifyTransaction(transactionId);

    if (!verification || !verification.verified) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 502 }
      );
    }

    const supabase = createAdminClient();

    let orderId = verification.orderId ?? null;

    if (!orderId && verification.txRef) {
      const orderByRef = await supabase
        .from('orders')
        .select('id')
        .eq('tx_ref', verification.txRef)
        .maybeSingle();

      orderId = orderByRef?.data?.id ?? null;
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const expectedAmount = Number(existingOrder.total_amount ?? 0);
    const receivedAmount = Number(verification.amount ?? 0);

    if (receivedAmount < expectedAmount) {
      return NextResponse.json(
        {
          error: 'Amount mismatch',
          expected: expectedAmount,
          received: receivedAmount,
        },
        { status: 422 }
      );
    }

    if (existingOrder.payment_confirmed) {
      return NextResponse.json(
        { success: true, already_processed: true },
        { status: 200 }
      );
    }

    if (
      verification.status &&
      !SUCCESSFUL_STATUSES.includes(verification.status)
    ) {
      await supabase
        .from('orders')
        .update({ status: 'payment_failed' })
        .eq('id', orderId);

      return NextResponse.json({ success: true }, { status: 200 });
    }

    await supabase
      .from('orders')
      .update({ payment_confirmed: true, status: 'confirmed' })
      .eq('id', orderId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[payments/webhook] unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
