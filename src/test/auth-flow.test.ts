/**
 * Tests for useAuth hook logic (Supabase mocked)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

beforeEach(() => {
  vi.clearAllMocks()

  // Reset mocks to default no-session state
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: null,
  } as never)
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  } as never)
})

describe('useAuth — initial state', () => {
  it('starts with isLoading=true then resolves to false', async () => {
    const { result } = renderHook(() => useAuth())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('user is null when no session exists', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })

  it('profile is null when no session exists', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toBeNull()
  })
})

describe('useAuth — signIn', () => {
  it('signIn calls supabase.auth.signInWithPassword with correct args', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.signIn('user@example.com', 'password123')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
  })

  it('signIn throws when supabase returns an error', async () => {
    const mockError = new Error('Invalid credentials')
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    } as never)

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(result.current.signIn('bad@example.com', 'wrong')).rejects.toThrow(
      'Invalid credentials',
    )
  })
})

describe('useAuth — signOut', () => {
  it('signOut calls supabase.auth.signOut', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.signOut()

    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
  })

  it('signOut throws when supabase returns an error', async () => {
    const mockError = new Error('Sign out failed')
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: mockError } as never)

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(result.current.signOut()).rejects.toThrow('Sign out failed')
  })
})

describe('useAuth — isAdmin and isApproved', () => {
  it('isAdmin is false when profile role is "user"', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'test@test.com' },
        },
      },
      error: null,
    } as never)

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'user-123',
          display_name: 'Test User',
          flag_code: 'kw',
          role: 'user',
          is_approved: true,
          created_at: '2024-01-01',
        },
        error: null,
      }),
    } as never)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAdmin).toBe(false)
  })

  it('isApproved is false when profile.is_approved is false', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-456', email: 'pending@test.com' },
        },
      },
      error: null,
    } as never)

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'user-456',
          display_name: 'Pending User',
          flag_code: 'kw',
          role: 'user',
          is_approved: false,
          created_at: '2024-01-01',
        },
        error: null,
      }),
    } as never)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isApproved).toBe(false)
  })

  it('isAdmin is false when profile is null', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAdmin).toBe(false)
  })

  it('isApproved is false when profile is null', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isApproved).toBe(false)
  })
})
