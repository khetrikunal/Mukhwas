import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'

declare global {
  // eslint-disable-next-line no-var
  var __resetLocalStorage: () => void
}

describe('authStore', () => {
  beforeEach(() => {
    ;(globalThis as any).__resetLocalStorage()
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  })

  it('setAuth stores user + token and flips isAuthenticated', () => {
    const u = { id: 'u1', name: 'Test', email: 't@e.com', role: 'CUSTOMER' as const }
    useAuthStore.getState().setAuth(u, 'access-token', 'refresh-token')

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual(u)
    expect(useAuthStore.getState().token).toBe('access-token')
    expect(localStorage.getItem('rm_token')).toBe('access-token')
    expect(localStorage.getItem('rm_refresh_token')).toBe('refresh-token')
  })

  it('logout clears auth state and tokens from localStorage', () => {
    const u = { id: 'u1', name: 'Test', email: 't@e.com', role: 'CUSTOMER' as const }
    useAuthStore.getState().setAuth(u, 'access-token', 'refresh-token')

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem('rm_token')).toBeNull()
    expect(localStorage.getItem('rm_refresh_token')).toBeNull()
    expect(localStorage.getItem('rm_user')).toBeNull()
  })
})
