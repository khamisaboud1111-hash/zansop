import { InitiatePaymentInput, InitiatePaymentResult, PaymentProviderAdapter } from './types'

/**
 * M-Pesa (Vodacom Tanzania) adapter.
 *
 * NOT LIVE YET. Once you have a merchant account, fill in:
 *   - MPESA_API_KEY / MPESA_PUBLIC_KEY in env vars
 *   - The real STK-push endpoint URL in `initiate()`
 *   - Signature verification in `handleCallback()`
 *
 * Until then this returns a clear "not configured" error instead of pretending
 * to charge anyone — never fake a successful payment.
 */
export const mpesaAdapter: PaymentProviderAdapter = {
  provider: 'mpesa',

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!process.env.MPESA_API_KEY) {
      return {
        success: false,
        status: 'failed',
        message: 'M-Pesa is not configured yet. Add MPESA_API_KEY and merchant credentials to enable real payments.',
      }
    }

    // --- Real integration goes here ---
    // const res = await fetch('https://openapi.m-pesa.com/.../stkpush', { ... })
    // return { success: true, status: 'pending', providerReference: res.transactionId }

    return { success: false, status: 'failed', message: 'M-Pesa integration not yet implemented.' }
  },

  async handleCallback(payload: unknown) {
    // Real implementation: verify signature, extract reference + result code
    throw new Error('M-Pesa callback handling not yet implemented.')
  },
}

