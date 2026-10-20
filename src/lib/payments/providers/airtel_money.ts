import { InitiatePaymentInput, InitiatePaymentResult, PaymentProviderAdapter } from './types'

/**
 * Airtel Money (Tanzania) adapter.
 *
 * NOT LIVE YET. Once you have a merchant account, fill in:
 *   - AIRTEL_MONEY_API_KEY / MPESA_PUBLIC_KEY in env vars
 *   - The real STK-push endpoint URL in `initiate()`
 *   - Signature verification in `handleCallback()`
 *
 * Until then this returns a clear "not configured" error instead of pretending
 * to charge anyone — never fake a successful payment.
 */
export const airtelMoneyAdapter: PaymentProviderAdapter = {
  provider: 'airtel_money',

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!process.env.AIRTEL_MONEY_API_KEY) {
      return {
        success: false,
        status: 'failed',
        message: 'Airtel Money is not configured yet. Add AIRTEL_MONEY_API_KEY and merchant credentials to enable real payments.',
      }
    }

    // --- Real integration goes here ---
    // const res = await fetch('https://openapi.m-pesa.com/.../stkpush', { ... })
    // return { success: true, status: 'pending', providerReference: res.transactionId }

    return { success: false, status: 'failed', message: 'Airtel Money integration not yet implemented.' }
  },

  async handleCallback(payload: unknown) {
    // Real implementation: verify signature, extract reference + result code
    throw new Error('Airtel Money callback handling not yet implemented.')
  },
}

