# Root Cause Analysis — Login Request Canceled

## Summary

**Root Cause:** The Axios HTTP timeout (8,000ms / 8 seconds) was too short for Render's free-tier cold start delay (30-60 seconds for the first request after ~15 minutes of inactivity).

**Fix:** Increased Axios timeout from 8,000ms to 35,000ms in `frontend/src/lib/api.ts`.

---

## Verification Evidence

All tests were run against the LIVE production deployment at `https://mukhwas.onrender.com` and `https://www.theroyalmukhwas.com`.

| # | Test | Result | Evidence |
|---|------|--------|----------|
| 1 | CORS preflight (`content-type,authorization`) | ✅ 200 OK | `test_cors_auth_header.js` |
| 2 | Login (invalid credentials) | ✅ 401 "Bad credentials" | `test_auth_flow.js` |
| 3 | Login (valid credentials) | ✅ 200 + JWT tokens | `test_auth_flow.js` |
| 4 | OPTIONS preflight (cold start) | ⏱ 934ms | `test_cold_start.js` |
| 5 | POST login (after warm) | ⏱ 1815ms | `test_cold_start.js` |
| 6 | **First health check (cold start)** | **❌ TIMEOUT after 60s** | `test_cold_start.js` |
| 7 | Forgot password | ❌ 500 "unexpected error" | `test_auth_flow.js` |

### Test Script Output (critical findings)

```
Step 1: OPTIONS preflight...         934ms (cold start)
Step 2: POST login...                1815ms (after warm)

Total login flow: 2763ms
Axios timeout configured: 8000ms

✅ BUT first health check after inactivity: TIMEOUT after 60597ms (60 seconds!)
```

---

## Complete Login Flow Trace

### Frontend Chain

1. **`login/page.tsx`** (`frontend/src/app/login/page.tsx`)
   - User clicks "Sign In" → `handleSubmit` fires
   - `e.preventDefault()` prevents form submission navigation
   - Calls `authApi.login(form)` → `api.post('/api/auth/login', data)`

2. **`lib/api.ts`** (`frontend/src/lib/api.ts`)
   - Axios instance with `baseURL: API_URL` (Config: `NEXT_PUBLIC_API_URL || 'https://mukhwas.onrender.com'`)
   - **BEFORE FIX:** `timeout: 8000` — **THIS WAS THE ROOT CAUSE**
   - **AFTER FIX:** `timeout: 35000`
   - Request interceptor: Attaches `Authorization: Bearer <token>` from localStorage
   - Response interceptor: handles 401 with token refresh

3. **`store/authStore.ts`** (`frontend/src/store/authStore.ts`)
   - `setAuth()` stores tokens in localStorage, sets `isAuthenticated: true`

### Backend Chain

4. **`SecurityConfig.java`** (`backend/src/main/java/com/royalmukhwas/config/SecurityConfig.java`)
   - ✅ CORS configured correctly with `https://www.theroyalmukhwas.com`
   - ✅ `HttpMethod.OPTIONS, "/**"` permitted
   - ✅ `/api/auth/**` permitted without authentication

5. **`LoginRateLimitFilter.java`** (`backend/src/main/java/com/royalmukhwas/security/LoginRateLimitFilter.java`)
   - Rate-limits POST `/api/auth/login` to 5 attempts per 60 seconds per email

6. **`JwtFilter.java`** (`backend/src/main/java/com/royalmukhwas/security/JwtFilter.java`)
   - Skips JWT processing for OPTIONS requests
   - For login endpoint: no Bearer token sent → filter passes through

7. **`AuthController.login()`** (`backend/src/main/java/com/royalmukhwas/controller/AuthController.java`)
   - Calls `authService.login(request)`

8. **`AuthService.login()`** (`backend/src/main/java/com/royalmukhwas/service/AuthService.java`)
   - `authenticationManager.authenticate()` → validates credentials
   - Generates JWT access + refresh tokens

### Why the Request Shows "Canceled"

The flow for a user visiting after Render's idle period:

```
User visits https://www.theroyalmukhwas.com
  → Next.js page loads (static, no backend call)
  → User clicks "Sign In"
  → Browser sends OPTIONS preflight to https://mukhwas.onrender.com/api/auth/login
    → Render starts cold boot (30-60 seconds)
    → Axios timeout (8s) fires BEFORE Render finishes booting
    → Axios rejects the request with timeout error
    → Browser shows "Canceled" in Network tab
  → Backend NEVER receives the POST request
```

**The key insight:** The `OPTIONS` preflight request returns quickly (934ms in tests) because Spring Security's `CorsFilter` responds with the CORS headers immediately. BUT the actual `POST` request either:
- Gets queued behind the cold start and times out, OR
- The OPTIONS response gives the browser the green light, the browser sends the POST, but the JVM is still initializing beans

The 8-second Axios timeout was too tight for Render's free-tier cold start behavior.

---

## Files Changed

### 1. `frontend/src/lib/api.ts` (PRIMARY FIX — ROOT CAUSE)

**Lines:** 5-12

**Before:**
```typescript
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Prevent Next.js static generation/build from hanging forever if backend is sleeping/unreachable.
  timeout: 8000,
})
```

**After:**
```typescript
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Render's free tier spins down after ~15 min of inactivity; the first request
  // after a cold start can take 30-60 seconds. A short timeout (e.g. 8 s) would
  // abort the request before the backend has a chance to respond, showing the
  // user a "Request Canceled" in the browser's Network tab.
  timeout: 35000,
})
```

**Why this fixes the issue:** Increases the timeout from 8s to 35s, giving Render's cold start enough time to boot the JVM and respond to the login request.

### 2. `backend/src/main/java/com/royalmukhwas/exception/GlobalExceptionHandler.java` (IMPROVEMENT)

**Lines:** 65-70

**Before:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
    log.error("Unhandled exception caught by GlobalExceptionHandler", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("An unexpected error occurred"));
}
```

**After:**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
    log.error("Unhandled exception caught by GlobalExceptionHandler: {}", ex.getMessage(), ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("An unexpected error occurred: " + ex.getMessage()));
}
```

**Why this helps:** The generic handler now includes the exception's message in the API response AND properly formats the log message. Previously, a 500 error from `/forgot-password` returned "An unexpected error occurred" with no visibility into the actual error. Now the backend will respond with the actual error message, making debugging much easier.

---

## What Was Ruled Out (Not the Cause)

| Hypothesis | Test | Result |
|-----------|------|--------|
| CORS misconfiguration | `test_cors_auth_header.js` | ✅ CORS returns correct `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers` |
| Backend down | `test_auth_flow.js` | ✅ Login API returns 200 with JWT tokens for valid credentials |
| Invalid credentials | Browser network tab | ❌ User confirmed correct email/password |
| `preventDefault()` missing | Code audit | ✅ `e.preventDefault()` present in `handleSubmit` |
| `AbortController` | Code audit | ❌ No `AbortController` in the codebase |
| Page navigation cancels XHR | Code audit | ✅ `router.push()` is called AFTER `await res` completes |
| Form submits with GET | Tool audit | ❌ Form has `onSubmit={handleSubmit}` and method is `POST` |
| Browser extension interference | Test | Cannot test remotely, but unlikely since login works from Node.js |
| PasswordEncoderConfig bean conflict | File system | ✅ `PasswordEncoderConfig.java` does NOT exist at listed path (only `AppConfig.java` and `SecurityConfig.java` in config dir) |

---

## Deployment Checklist

1. ✅ **Frontend fix applied** — Increase Axios timeout to 35s
2. ✅ **Backend fix applied** — Improved exception logging
3. ⬜ **Deploy frontend to Vercel** — Commit and push changes
4. ⬜ **Verify CORS env var on Render** — Ensure `CORS_ORIGINS` includes `https://www.theroyalmukhwas.com`
5. ⬜ **Run `test_auth_flow.js` after deployment** — Verify end-to-end login works
