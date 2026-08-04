import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cartApi } from '@/lib/api'

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantLabel: string
  imageUrl?: string
  price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  couponCode: string | null
  discount: number
  /**
   * Server-authoritative shipping charge. Set by `resetFromServer()` after
   * every API call. When `synced=false` (guest / pre-hydration), this stays
   * at 0 — use `computedShipping` for display instead.
   */
  shipping: number
  synced: boolean         // true once the cart has been hydrated from the server
  hydrating: boolean
  addItem: (item: CartItem) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  clearCart: () => Promise<void>
  applyCoupon: (code: string, discount?: number) => Promise<void>
  removeCoupon: () => Promise<void>
  hydrate: () => Promise<void>
  resetFromServer: (data: ServerCart) => void
  /**
   * Always-correct subtotal: sum of (price × quantity) for all cart items.
   * Computed on-the-fly — never hardcoded.
   */
  get subtotal(): number
  /**
   * Always-correct shipping charge:
   * - When synced (authenticated): uses server-returned `shipping` value.
   * - When not synced (guest): computed locally — FREE if subtotal ≥ ₹499, else ₹50.
   */
  get computedShipping(): number
  /**
   * Always-correct order total: subtotal + computedShipping − discount.
   * Never hardcoded.
   */
  get total(): number
  get itemCount(): number
}

/** Shape returned by GET /api/cart (CartResponse on the backend). */
export interface ServerCart {
  id: string
  items: Array<{
    variantId: string
    productId: string
    productName: string
    variantLabel: string
    imageUrl?: string
    unitPrice: number
    quantity: number
    lineTotal: number
    stockQuantity: number
  }>
  couponCode: string | null
  couponValid: boolean
  subtotal: number
  discount: number
  shipping: number
  total: number
  itemCount: number
}

const FREE_SHIPPING_THRESHOLD = 499
const FLAT_SHIPPING = 50
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,
      shipping: 0,
      synced: false,
      hydrating: false,

      // ── Hydrate from server on login ───────────────────────────────────────
      hydrate: async () => {
        if (get().hydrating) return
        set({ hydrating: true })
        try {
          const res = await cartApi.get()
          get().resetFromServer(res.data.data)
        } catch {
          // Not logged in or network error — keep local cart as-is.
          set({ synced: false })
        } finally {
          set({ hydrating: false })
        }
      },

      resetFromServer: (data: ServerCart) =>
        set({
          items: data.items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            productName: i.productName,
            variantLabel: i.variantLabel,
            imageUrl: i.imageUrl,
            price: i.unitPrice,
            quantity: i.quantity,
          })),
          couponCode: data.couponValid ? data.couponCode : null,
          discount: data.discount,
          shipping: data.shipping,
          synced: true,
        }),

      // ── Mutations: server-first when synced, local fallback for guests ─────
      addItem: async (newItem) => {
        if (get().synced) {
          // Server-authoritative path: call the API and sync state from the response.
          // Verify that variantId is a valid UUID to prevent sending mock IDs like 'v-1' to the backend.
          if (!UUID_RE.test(newItem.variantId)) {
            console.error(`[cartStore] Refusing to add non-UUID variantId "${newItem.variantId}" to server cart.`)
            throw new Error(`Invalid variant ID: ${newItem.variantId}`)
          }
          // Do NOT catch here — let the error propagate to the caller (e.g. handleAddToCart)
          // so it can show a proper error toast instead of a misleading success message.
          const res = await cartApi.add({ variantId: newItem.variantId, quantity: newItem.quantity })
          get().resetFromServer(res.data.data)
          return
        }
        // Guest / pre-login fallback: update local state only.
        set((state) => {
          const existing = state.items.find((i) => i.variantId === newItem.variantId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, newItem] }
        })
      },


      updateQuantity: async (variantId, quantity) => {
        // If quantity drops to zero or below, remove the item instead of updating
        if (quantity <= 0) {
          await get().removeItem(variantId)
          return
        }
        if (get().synced) {
          try {
            const res = await cartApi.update({ variantId, quantity })
            get().resetFromServer(res.data.data)
            return
          } catch {
            // API failed - revert to local mode to prevent perpetual desync
            set({ synced: false })
            /* fall through to local */
          }
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }))
      },

      removeItem: async (variantId) => {
        if (get().synced) {
          try {
            const res = await cartApi.remove(variantId)
            get().resetFromServer(res.data.data)
            return
          } catch {
            // API failed - revert to local mode to prevent perpetual desync
            set({ synced: false })
            /* fall through to local */
          }
        }
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) }))
      },

      clearCart: async () => {
        if (get().synced) {
          try {
            const res = await cartApi.clear()
            get().resetFromServer(res.data.data)
            return
          } catch {
            // API failed - revert to local mode to prevent perpetual desync
            set({ synced: false })
            /* fall through to local */
          }
        }
        set({ items: [], couponCode: null, discount: 0 })
      },

      applyCoupon: async (code, discount) => {
        if (get().synced) {
          const res = await cartApi.applyCoupon(code)
          get().resetFromServer(res.data.data)
          return
        }
        // Guest fallback: caller may pass a precomputed discount.
        set({ couponCode: code, discount: discount ?? 0 })
      },

      removeCoupon: async () => {
        if (get().synced) {
          const res = await cartApi.removeCoupon()
          get().resetFromServer(res.data.data)
          return
        }
        set({ couponCode: null, discount: 0 })
      },

      // ── Derived getters ─────────────────────────────────────────────────────

      /**
       * Subtotal = Σ(price × quantity) for all items.
       * Always computed from live state — never hardcoded.
       */
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },

      /**
       * Shipping charge — single source of truth for both display and total.
       *
       * Logic:
       *   • synced=true  → server already computed the correct charge (stored in `shipping` state).
       *   • synced=false → compute locally:
       *       subtotal ≥ FREE_SHIPPING_THRESHOLD → FREE (0)
       *       subtotal  < FREE_SHIPPING_THRESHOLD → FLAT_SHIPPING (₹50)
       *   • Empty cart (subtotal = 0) → always 0 (no shipping on empty cart).
       */
      get computedShipping() {
        const sub = get().subtotal
        if (sub <= 0) return 0 // empty cart — no shipping charge
        if (get().synced) {
          // Server-authoritative: trust what the backend returned
          return get().shipping
        }
        // Guest / pre-hydration: compute locally using the same threshold as the backend
        return sub >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
      },

      /**
       * Total = Subtotal + Shipping − Discount
       * Uses computedShipping so the logic is consistent with what's displayed.
       */
      get total() {
        const sub = get().subtotal
        const ship = get().computedShipping
        const disc = get().discount
        // Guard against negative totals (e.g. over-discounting)
        return Math.max(0, sub + ship - disc)
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    {
      name: 'rm_cart',
      /**
       * Sanitize the persisted cart on page load.
       *
       * Over time, localStorage may contain stale items whose `price` was stored
       * as 0 or NaN (e.g. from a previous session where the API returned an
       * unexpected shape). Strip those out so subtotal is never incorrectly 0.
       *
       * Authenticated users will have their cart overwritten by hydrate() anyway,
       * but guests rely entirely on localStorage so this guard matters for them.
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = state.items.filter(
            (item) => typeof item.price === 'number' && item.price > 0 && item.quantity > 0
          )
        }
      },
    }
  )
)
