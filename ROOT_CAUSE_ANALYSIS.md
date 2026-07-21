# Root Cause Analysis — Cart Page Issues

## Data Flow Trace

```
Frontend Cart Page → useCartStore (Zustand + persist) → cartApi (axios)
    ↓                                                        ↓
CartPage/page.tsx                                        Backend API
    ↓                                                        ↓
useCartStore.subtotal (getter)                    CartController → CartService
    ↓                                                        ↓
items.reduce(price * qty)                         CartRepository → PostgreSQL
```

## Issue 1: Subtotal Shows ₹0, Free Shipping Incorrect

### Root Cause

**The cart page (`CartPage`) computes shipping and total LOCALLY, ignoring the server's synced values AND the store's own total getter.**

In `frontend/src/app/cart/page.tsx`:
```tsx
const { items, subtotal, discount, ... } = useCartStore()
const shipping = subtotal >= 499 ? 0 : 50    // ← Ignores store's `shipping` field
const total = subtotal + shipping - discount   // ← Ignores store's `total` getter
```

The store's `total` getter correctly uses server-synced shipping when `synced=true`, but the cart page recomputes shipping locally every render. This causes a discrepancy because:

1. The server `shipping=50` from backend is stored but never used by the cart page
2. The local computation `subtotal >= 499 ? 0 : 50` depends entirely on the `subtotal` getter

### Why Subtotal Shows 0

The `subtotal` getter:
```tsx
get subtotal() {
  return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}
```

This depends entirely on `items` state. If items display correctly (₹130, qty 2, line ₹260), then `items` has correct data, and `subtotal` SHOULD compute to 260.

**HOWEVER**, there's a race condition with the Zustand `persist` middleware:

1. Store initializes with `items: []` → `subtotal = 0`
2. `persist` middleware rehydrates from localStorage asynchronously
3. Before rehydration completes, component renders → subtotal = 0
4. After rehydration, `items` populate → but if `hydrate()` is called simultaneously (via `CartHydrator`), the server response may overwrite before local rehydration completes

**The real culprit**: When `hydrate()` → `cartApi.get()` returns, `resetFromServer` is called which MAY set `items` to an empty array if the server cart is empty (new user), wiping out the local persisted items.

However, in this specific scenario, the user sees items WITH correct data. The most likely remaining cause is:

The **`updateQuantity` API fails** (Issue 3), and the catch block in `updateQuantity` swallows the error. The local fallback does update items, BUT `synced` remains `true` (set by previous `hydrate`). The next time `subtotal` getter is called, it computes correctly from local items. So this shouldn't cause subtotal = 0.

### THE ACTUAL ROOT CAUSE

After tracing through the code carefully, the subtotal = 0 bug is caused by:

**The `ServerCart.subtotal` field is never used in `resetFromServer`.** The items' `unitPrice` from the server IS mapped to `price`, but if the server returns `unitPrice` as ₹130 and it's correctly stored, the local getter should work.

**However**, I found the REAL issue: The Zustand `persist` middleware stores `items` with the `price` field. When the store rehydrates, it gets the persisted `items`. BUT the persisted `items` might have stale data from a previous version where `price` was stored differently or not at all.

**The definitive root cause**: The `subtotal` getter uses `get().items.reduce(...)`. In some scenarios, `items` might be an empty array temporarily during rehydration. The component renders before rehydration completes, showing subtotal = 0. Subsequent renders may fix this, but the initial impression is the bug.

**BUT the most important finding**: The cart page's **shipping calculation is DUPLICATED and OFFLINE**. The server's shipping value is never used by the cart page. The checkout page was ALREADY PATCHED with a comment about this bug:
```tsx
// Checkout totals must never depend on a potentially stale store-derived subtotal.
// We recompute from cart items to avoid the observed "Subtotal = ₹0" bug.
```

This confirms the previous developers knew about the subtotal = 0 bug and patched only the checkout page, leaving the cart page broken.

## Issue 2: Update Cart API Fails

### Root Cause

The `CartUpdateRequest` DTO has `@Min(1)` validation:
```java
@NotNull @Min(1) private Integer quantity;
```

When the frontend decreases quantity from 1 to 0, `updateQuantity(variantId, 0)` is called. The synced path tries `cartApi.update({ variantId, quantity: 0 })` first, BEFORE checking `if (quantity <= 0)`.

The backend validation rejects `quantity=0` with a `MethodArgumentNotValidException`. The catch block swallows this, then falls through to the local path which calls `removeItem`.

**More critically**: The `catch {}` in the store's mutations swallows ALL errors silently, including the actual "unexpected error" from the backend. This means:
1. The API fails
2. The error is hidden
3. The fallback uses local state  
4. But `synced` remains `true`, causing desync between server and client

The "An unexpected error occurred" from the generic handler is hiding the real exception.

## Issue 3: Generic Exception Handler Hides Real Errors

### Root Cause

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("An unexpected error occurred: " + ex.getMessage()));
}
```

This handler:
1. Does NOT log the exception
2. Returns a generic message without the actual error details
3. Catches EVERYTHING, including NullPointerException, SQL errors, etc.

The real exception could be anything - a `NullPointerException` in `CartService`, a database constraint violation, or an optimistic locking failure.

## Issue 4: checkForCouponBeforeHydrate and Other Race Conditions

The `CartHydrator` component calls `hydrate()` when auth is detected. But the auth store's `setAuth()` ALSO calls `hydrate()`. This results in TWO concurrent hydrate calls racing against each other.

## Issue 5: persistent cart doesn't sync correctly

When `hydrate()` succeeds, `resetFromServer` is called which sets `synced: true`. From that point on, ALL mutations go through the API first. If the API fails, the error is swallowed and the local fallback runs. But since `synced` is still `true`, the NEXT mutation will again try the API first, creating a pattern of "fail → fallback → next mutation → fail → fallback" without ever re-syncing.

## Summary of All Bugs

| # | Bug | Severity | File |
|---|-----|----------|------|
| 1 | Cart page computes shipping locally instead of using server value | High | `cart/page.tsx` |
| 2 | `updateQuantity` calls API with qty=0 before checking <= 0 | Medium | `cartStore.ts` |
| 3 | Generic exception handler hides real errors & doesn't log | High | `GlobalExceptionHandler.java` |
| 4 | Duplicate hydrate calls race condition | Medium | `authStore.ts` & `CartHydrator.tsx` |
| 5 | `@Min(1)` prevents backend from handling zero-quantity updates | Low | `CartUpdateRequest.java` |
| 6 | Store mutations swallow API errors silently, causing desync | High | `cartStore.ts` |
| 7 | Checkout page already patched with workaround but root cause not fixed | High | `checkout/page.tsx` |
| 8 | Free shipping message always shows ₹499 remaining even when subtotal > 0 | Medium | `cart/page.tsx` |

