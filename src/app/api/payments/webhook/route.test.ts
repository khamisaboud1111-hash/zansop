import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/payments/aggregator', () => ({
  isValidWebhookSignature: vi.fn(),
  verifyTransaction: vi.fn(),
}))

import { POST } from './route'
import { isValidWebhookSignature, verifyTransaction } from '@/lib/payments/aggregator'
import { createAdminClient } from '@/lib/supabase/admin'

const mockedIsValidSignature = isValidWebhookSignature as ReturnType<typeof vi.fn>
const mockedVerifyTransaction = verifyTransaction as ReturnType<typeof vi.fn>
const mockedCreateAdminClient = createAdminClient as ReturnType<typeof vi.fn>

function makeRequest(body: any, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.FLUTTERWAVE_SECRET_HASH = 'test-secret-hash'
  })

  afterEach(() => {
    delete process.env.FLUTTERWAVE_SECRET_HASH
  })

  it('rejects request without valid signature', async () => {
    const req = makeRequest({ data: { id: '123' } }, { 'verif-hash': 'invalid' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects request with missing signature', async () => {
    const req = makeRequest({ data: { id: '123' } })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects invalid JSON', async () => {
    const req = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'verif-hash': 'test-secret-hash' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects when transaction verification fails', async () => {
    const { verifyTransaction } = await import('@/lib/payments/aggregator')
    const mockedVerifyTransaction = vi.mocked(verifyTransaction)
    mockedVerifyTransaction.mockResolvedValue({ verified: false })
    
    const req = makeRequest({ data: { id: 'tx-123' } }, { 'verif-hash': 'test-secret-hash' })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('rejects when amount is less than order total', async () => {
    const { verifyTransaction } = await import('@/lib/payments/aggregator')
    const mockedVerifyTransaction = vi.mocked(verifyTransaction)
    mockedVerifyTransaction.mockResolvedValue({
      verified: true,
      status: 'successful',
      amount: 500,
      orderId: null,
      txRef: 'tx-ref-1',
    })
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'order-1' } }),
      single: vi.fn().mockResolvedValue({ data: { id: 'order-1', total_amount: 10000, payment_confirmed: false, status: 'pending' } }),
      update: vi.fn().mockReturnThis(),
    }
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const mockedCreateAdminClient = vi.mocked(createAdminClient)
    mockedCreateAdminClient.mockReturnValue(mockSupabase)
    const req = makeRequest({ data: { id: 'tx-123' } }, { 'verif-hash': 'test-secret-hash' })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('accepts already-processed orders idempotently', async () => {
    const { verifyTransaction } = await import('@/lib/payments/aggregator')
    const mockedVerifyTransaction = vi.mocked(verifyTransaction)
    mockedVerifyTransaction.mockResolvedValue({
      verified: true,
      status: 'successful',
      amount: 10000,
      orderId: 'order-1',
      txRef: null,
    })
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'order-1', total_amount: 10000, payment_confirmed: true, status: 'confirmed' } }),
    }
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const mockedCreateAdminClient = vi.mocked(createAdminClient)
    mockedCreateAdminClient.mockReturnValue(mockSupabase)
    const req = makeRequest({ data: { id: 'tx-123' } }, { 'verif-hash': 'test-secret-hash' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.already_processed).toBe(true)
  })
})

