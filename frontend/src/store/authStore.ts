import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CUSTOMER' | 'WHOLESALE'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('rm_token', token)
        if (refreshToken) localStorage.setItem('rm_refresh_token', refreshToken)
        set({ user, token, isAuthenticated: true })
        // Hydrate the server-side cart for this user (lazy import avoids a circular dep
        // at module-load time, since cartStore imports nothing from authStore).
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.getState().hydrate()
        })
      },
      logout: () => {
        localStorage.removeItem('rm_token')
        localStorage.removeItem('rm_refresh_token')
        localStorage.removeItem('rm_user')
        set({ user: null, token: null, isAuthenticated: false })
        // Reset cart store to guest mode so stale server state doesn't leak.
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.setState({
            items: [],
            couponCode: null,
            discount: 0,
            shipping: 0,
            synced: false,
          })
        })
      },
    }),
    { name: 'rm_auth' }
  )
)
