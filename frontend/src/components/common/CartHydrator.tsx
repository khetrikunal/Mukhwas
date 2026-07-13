'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

/**
 * Mounts once in the root layout. If the user is already authenticated on page
 * load (auth restored from localStorage by the persisted Zustand store), fetch
 * their server-side cart so totals are server-authoritative.
 *
 * No UI is rendered.
 */
export default function CartHydrator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const synced = useCartStore((s) => s.synced)
  const hydrate = useCartStore((s) => s.hydrate)

  useEffect(() => {
    if (isAuthenticated && !synced) {
      hydrate()
    }
  }, [isAuthenticated, synced, hydrate])

  return null
}
