import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWishlist } from './useWishlist'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/store', () => ({
  useLangStore: vi.fn(() => ({ lang: 'en' })),
}))

const mockedCreateClient = createClient as ReturnType<typeof vi.fn>

function createMockSupabase() {
  return {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  }
}

describe('useWishlist', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    mockedCreateClient.mockReturnValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  it('should initialize with loading true', () => {
    const { result } = renderHook(() => useWishlist('product1'))
    expect(result.current.isWishlisted).toBe(false)
    expect(result.current.loading).toBe(true)
  })

  it('should set wishlisted to true when user has the product in wishlist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockSupabase.single.mockResolvedValue({ data: { id: 'wishlist1' }, error: null })

    const { result } = renderHook(() => useWishlist('product1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isWishlisted).toBe(true)
  })

  it('should set wishlisted to false when user does not have the product in wishlist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockSupabase.single.mockRejectedValue({ code: 'PGRST116' })

    const { result } = renderHook(() => useWishlist('product1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isWishlisted).toBe(false)
  })

  it('should handle error when checking wishlist status', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockSupabase.single.mockRejectedValue(new Error('Database error'))

    const { result } = renderHook(() => useWishlist('product1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isWishlisted).toBe(false)
  })
})

