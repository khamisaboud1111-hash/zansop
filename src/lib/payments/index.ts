import { PaymentProvider } from '@/types'
import { PaymentProviderAdapter } from './types'
import { mpesaAdapter } from './providers/mpesa'
import { airtelMoneyAdapter } from './providers/airtel_money'
import { tigoPesaAdapter } from './providers/tigo_pesa'

const registry: Record<string, PaymentProviderAdapter> = {
  mpesa: mpesaAdapter,
  airtel_money: airtelMoneyAdapter,
  tigo_pesa: tigoPesaAdapter,
}

export function getPaymentAdapter(provider: PaymentProvider): PaymentProviderAdapter | null {
  return registry[provider] ?? null
}

export * from './types'

