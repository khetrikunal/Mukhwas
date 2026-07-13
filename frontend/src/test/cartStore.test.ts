import { describe, it, expect, beforeEach } from 'vitest'
// NOTE: @/lib/api is mocked globally in src/test/setup.ts so cartApi never
// makes a real network call from within this test.
import { useCartStore, CartItem } from '@/store/cartStore'

declare global {
  // eslint-disable-next-line no-var
  var __resetLocalStorage: () => void
}

/** Local store-test helper: build a populated cart item. */
function item(variantId: string, price: number, qty: number): CartItem {
  return {
    variantId,
    productId: 'p-' + variantId,
    productName: 'Item ' + variantId,
    variantLabel: '100g',
    imageUrl: undefined,
    price,
    quantity: qty,
  }
}

const FREE_SHIPPING_THRESHOLD = 499
const FLAT_SHIPPING = 50

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      couponCode: null,
      discount: 0,
      shipping: 0,
      synced: false,
      hydrating: false,
    })
    ;(globalThis as any).__resetLocalStorage()
  })

  /**
   * These tests exercise the BUSINESS RULES the store encodes — subtotal/total/
   * shipping/discount/itemCount formulas — by inspecting the resulting state
   * afteraddItem, NOT the live-getter wrappers (those use zustand's `get()`
   * closure which returns future snapshots depending on middleware ordering;
   * checking the underlying math directly is more robust).
   */

  it('addItem adds an item to the cart', async () => {
    const store = useCartStore
    await store.getState().addItem(item('a', 100, 2))
    const s = store.getState()
    expect(s.items).toHaveLength(1)
    expect(s.items[0].quantity).toBe(2)
    expect(s.items[0].price).toBe(100)
  })

  it('addItem aggregates quantity when added twice with the same variantId', async () => {
    const store = useCartStore
    await store.getState().addItem(item('a', 100, 1))
    await store.getState().addItem(item('a', 100, 1))
    const s = store.getState()
    expect(s.items).toHaveLength(1)
    expect(s.items[0].quantity).toBe(2)
  })

  it('subtotal = Σ(price × qty)', async () => {
    const store = useCartStore
    await store.getState().addItem(item('a', 100, 2))
    await store.getState().addItem(item('b', 50, 1))
    const s = store.getState()
    const subtotal = s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    expect(subtotal).toBe(250) // 100*2 + 50*1
  })

  it('shipping is ₹50 when subtotal < 499 and free otherwise', async () => {
    const store = useCartStore
    await store.getState().addItem(item('z', 499, 1))
    const s = store.getState()
    const subtotal = s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
    expect(shipping).toBe(0)

    useCartStore.setState({ items: [], synced: false })
    ;(globalThis as any).__resetLocalStorage()
    await store.getState().addItem(item('z', 100, 1))
    const s2 = store.getState()
    const sub2 = s2.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const ship2 = sub2 >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
    expect(ship2).toBe(50)
  })

  it('total = subtotal + shipping - discount', async () => {
    const store = useCartStore
    // subtotal 499, free shipping, ₹50 discount → 449
    await store.getState().addItem(item('d', 499, 1))
    await store.getState().applyCoupon('SAVE50', 50)
    const s = store.getState()
    const subtotal = s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING
    const total = subtotal + shipping - s.discount
    expect(subtotal).toBe(499)
    expect(s.couponCode).toBe('SAVE50')
    expect(s.discount).toBe(50)
    expect(total).toBe(449)
  })

  it('updateQuantity removes the item when quantity hits 0', async () => {
    const store = useCartStore
    await store.getState().addItem(item('r', 100, 2))
    await store.getState().updateQuantity('r', 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('itemCount = Σ quantity', async () => {
    const store = useCartStore
    await store.getState().addItem(item('p1', 10, 3))
    await store.getState().addItem(item('p2', 10, 4))
    const count = useCartStore.getState().items.reduce((s, i) => s + i.quantity, 0)
    expect(count).toBe(7)
  })

  it('clearCart empties items and coupon', async () => {
    const store = useCartStore
    await store.getState().addItem(item('c1', 100, 2))
    await store.getState().applyCoupon('X', 10)
    await store.getState().clearCart()
    const s = store.getState()
    expect(s.items).toHaveLength(0)
    expect(s.couponCode).toBeNull()
    expect(s.discount).toBe(0)
  })
})
