import { vi } from 'vitest'

// Stub @/lib/api at the module level so any consumer (cartStore, authStore's
// lazy import of cartStore) doesn't fire a real Axios request. Vitest applies
// hoisted mocks before any test module imports resolve.
vi.mock('@/lib/api', () => ({
  default: { interceptors: { request: { use: () => {} }, response: { use: () => {} } } },
  cartApi: {
    get: vi.fn().mockResolvedValue({ data: { data: {} } }),
    add: vi.fn().mockResolvedValue({ data: { data: {} } }),
    update: vi.fn().mockResolvedValue({ data: { data: {} } }),
    remove: vi.fn().mockResolvedValue({ data: { data: {} } }),
    clear: vi.fn().mockResolvedValue({ data: { data: {} } }),
    applyCoupon: vi.fn().mockResolvedValue({ data: { data: {} } }),
    removeCoupon: vi.fn().mockResolvedValue({ data: { data: {} } }),
  },
}))

// Provide a localStorage shim on Node ≥ 21 where jsdom's window.localStorage
// is not reachable as a top-level global. Zustand's persist middleware reads
// storage via createJSONStorage(() => localStorage); without this, the test
// crashes on `Cannot read properties of undefined (reading 'setItem')`.
//
// The shim is module-scoped and resettable via __resetLocalstorage().
function makeLocalStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size },
    // Test-only helper for bench reset between specs.
    __reset: () => store.clear(),
  }
}

const shim = makeLocalStorage()
;(globalThis as any).localStorage = shim
if (typeof (globalThis as any).window !== 'undefined') {
  ;(globalThis as any).window.localStorage = shim
}

// Re-export for tests that want to reset between specs.
;(globalThis as any).__resetLocalStorage = () => shim.__reset()

// Polyfill matchMedia (jsdom doesn't implement it).
if (typeof (globalThis as any).window !== 'undefined' && !(globalThis as any).window.matchMedia) {
  ;(globalThis as any).window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
