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
  // Server-authoritative totals when authenticated; otherwise computed locally.
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
  get subtotal(): number
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
          try {
            const res = await cartApi.add({ variantId: newItem.variantId, quantity: newItem.quantity })
            get().resetFromServer(res.data.data)
            return
          } catch {
            // API failed - revert to local mode to prevent perpetual desync
            set({ synced: false })
            /* fall through to local */
          }
        }
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
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },

      get total() {
        const sub = get().subtotal
        // When synced, the server already computed shipping; otherwise compute locally.
        const shipping = get().synced
          ? get().shipping
          : sub >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
        return sub + shipping - get().discount
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    { name: 'rm_cart' }
  )
)
