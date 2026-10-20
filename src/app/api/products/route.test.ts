import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}))

import { POST } from './route'
import { createServerClient } from '@/lib/supabase/server'

const mockedCreateServerClient = createServerClient as ReturnType<typeof vi.fn>

function makeRequest(body: any, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-numeric price (mass assignment protection)', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'seller-1', status: 'approved' } }),
    }
    mockedCreateServerClient.mockReturnValue(mockSupabase)

    const req = makeRequest({ name: 'Test', price: 'free', status: 'active' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Validation failed')
  })

  it('rejects attempt to set restricted fields like status', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'seller-1', status: 'approved' } }),
      insert: vi.fn().mockReturnThis(),
    }
    mockedCreateServerClient.mockReturnValue(mockSupabase)

    const req = makeRequest({ name: 'Test Product', price: 5000, status: 'active', total_sold: 999, is_featured: true })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('accepts valid product data', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'seller-1', status: 'approved' } }),
      insert: vi.fn().mockReturnThis(),
    }
    mockedCreateServerClient.mockReturnValue(mockSupabase)

    const req = makeRequest({ name: 'Test Product', price: 5000, stock_quantity: 10 })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})

