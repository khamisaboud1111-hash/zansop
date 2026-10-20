import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useProducts } from './useProducts'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

const mockedCreateClient = createClient as ReturnType<typeof vi.fn>

function createChainMock() {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return undefined
      return (...args: any[]) => {
        const result = createChainMock()
        return result
      }
    },
  }
  return new Proxy({}, handler)
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    mockedCreateClient.mockReturnValue({ from: () => createChainMock() } as any)
    const { result } = renderHook(() => useProducts())
    expect(result.current.loading).toBe(true)
    expect(result.current.products).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.error).toBeNull()
  })
})

