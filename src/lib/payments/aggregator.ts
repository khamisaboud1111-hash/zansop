/**
 * Zero-budget payment aggregator integration via Flutterwave.
 *
 * WHY AN AGGREGATOR INSTEAD OF DIRECT M-PESA/TIGO/AIRTEL INTEGRATIONS:
 * Direct MNO integrations (see src/lib/payments/providers/*.ts) require a
 * separate merchant agreement with each telco, often with setup costs and
 * paperwork that take time to arrange. Flutterwave (and similarly Paystack)
 * let you accept M-Pesa, Tigo Pesa, Airtel Money and cards in Tanzania under
 * ONE merchant account, charging only a per-transaction fee (no monthly fee,
 * no setup cost) — which fits the zero-budget requirement. This file does
 * NOT replace the existing src/lib/payments/* adapters; those stay in place
 * for if/when you get direct MNO merchant credentials later. This is an
 * additional, currently-recommended path for going live today.
 *
 * Setup required (one-time, free):
 *   1. Create a Flutterwave account at https://dashboard.flutterwave.com
 *   2. Get your Test (then Live) Secret Key and Public Key
 *   3. Add env vars: FLUTTERWAVE_SECRET_KEY, FLUTTERWAVE_SECRET_HASH
 *      (FLUTTERWAVE_SECRET_HASH is a string YOU choose in the Flutterwave
 *      dashboard under Settings -> Webhooks -> "Secret hash" — it's how we
 *      verify incoming webhooks are really from Flutterwave, not spoofed)
 */

import { timingSafeEqual } from 'crypto'

const FLW_BASE_URL = 'https://api.flutterwave.com/v3'

export interface CreateCheckoutLinkInput {
  orderId: string
  amount: number // TZS, whole shillings
  customerEmail: string
  customerPhone: string
  customerName: string
  redirectUrl: string
}

export interface CreateCheckoutLinkResult {
  success: boolean
  paymentLink?: string
  txRef?: string
  message?: string
}

/**
 * Creates a hosted Flutterwave checkout link. The buyer is redirected there,
 * picks M-Pesa / Tigo Pesa / Airtel Money / card, completes payment, and is
 * sent back to redirectUrl. The actual payment confirmation arrives async via
 * the webhook in api/payments/webhook/route.ts — never trust the redirect
 * alone to mark an order paid, since a buyer could close the tab or the
 * redirect could be spoofed.
 */
export async function createCheckoutLink(input: CreateCheckoutLinkInput): Promise<CreateCheckoutLinkResult> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!secretKey) {
    return {
      success: false,
      message: 'Malipo ya mtandaoni hayajawekwa bado. Ongeza FLUTTERWAVE_SECRET_KEY kwenye mazingira (env vars).',
    }
  }

  // tx_ref must be unique per attempt — include a timestamp so retries on the
  // same order don't collide with a previous attempt's reference.
  const txRef = `zanshop-${input.orderId}-${Date.now()}`

  try {
    const res = await fetch(`${FLW_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: input.amount,
        currency: 'TZS',
        redirect_url: input.redirectUrl,
        customer: {
          email: input.customerEmail,
          phonenumber: input.customerPhone,
          name: input.customerName,
        },
        customizations: {
          title: 'Zanshop',
          description: `Malipo ya agizo #${input.orderId.slice(0, 8).toUpperCase()}`,
        },
        meta: {
          order_id: input.orderId,
        },
      }),
    })

    const json = await res.json()

    if (json.status !== 'success' || !json.data?.link) {
      return { success: false, message: json.message ?? 'Flutterwave imekataa ombi la malipo' }
    }

    return { success: true, paymentLink: json.data.link, txRef }
  } catch (err) {
    console.error('[aggregator] createCheckoutLink error:', err)
    return { success: false, message: 'Hitilafu ya mtandao wakati wa kuunganisha na mtoa huduma wa malipo' }
  }
}

/**
 * Verifies a completed transaction directly with Flutterwave's API using the
 * transaction id from the webhook payload — this is the trusted source of
 * truth, NOT the webhook payload's own "status" field (which could in theory
 * be tampered with before signature verification, depending on how paranoid
 * you want to be; verifying server-to-server against Flutterwave itself is
 * the recommended pattern in their docs).
 */
export async function verifyTransaction(transactionId: string | number): Promise<{
  verified: boolean
  status?: string
  amount?: number
  currency?: string
  txRef?: string
  orderId?: string
}> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!secretKey) return { verified: false }

  try {
    const res = await fetch(`${FLW_BASE_URL}/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    })
    const json = await res.json()

    if (json.status !== 'success') return { verified: false }

    return {
      verified: true,
      status: json.data.status, // 'successful' | 'failed' | ...
      amount: json.data.amount,
      currency: json.data.currency,
      txRef: json.data.tx_ref,
      orderId: json.data.meta?.order_id,
    }
  } catch (err) {
    console.error('[aggregator] verifyTransaction error:', err)
    return { verified: false }
  }
}

/**
 * Compares the incoming webhook's verif-hash header against the secret hash
 * you configured in the Flutterwave dashboard. Reject anything that doesn't
 * match exactly — this is what stops a spoofed webhook from marking a fake
 * order as paid.
 */
export function isValidWebhookSignature(headerValue: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_SECRET_HASH
  if (!expected || !headerValue) return false
  try {
    return timingSafeEqual(
      Buffer.from(headerValue, 'utf8'),
      Buffer.from(expected, 'utf8')
    )
  } catch {
    return false
  }
}


