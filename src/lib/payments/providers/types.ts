import { PaymentProvider } from '@/types'

export interface InitiatePaymentInput {
  orderId: string
  amount: number
  phoneNumber: string
  provider: PaymentProvider
}

export interface InitiatePaymentResult {
  success: boolean
  /** Reference to show the buyer / poll status with (checkout request ID, etc.) */
  providerReference?: string
  /** Some providers (M-Pesa STK push) confirm instantly; others need a webhook */
  status: 'pending' | 'completed' | 'failed'
  message?: string
}

export interface PaymentProviderAdapter {
  provider: PaymentProvider
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>
  /** Verify/parse an incoming webhook callback from the provider */
  handleCallback(payload: unknown): Promise<{
    providerReference: string
    status: 'completed' | 'failed'
    rawPayload: unknown
  }>
}

