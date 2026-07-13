---
doc: TESTING
focus: quality
last_mapped: 2026-07-07
---

# Testing — The Royal Mukhwas

## Current state: effectively no automated tests

As of 2026-07-07, **this codebase has no automated tests**. Verification was
done by direct filesystem inspection:

| Check | Command | Result |
|-------|---------|--------|
| Backend test sources | `find backend/src/test -type f` | **No `backend/src/test/` directory exists** |
| Backend test runner | `spring-boot-starter-test` in `pom.xml` | Dependency declared, but **zero tests use it** |
| Frontend test script | `frontend/package.json` `scripts` | Only `dev`, `build`, `start`, `lint` — **no `test` script** |
| Frontend test runner | jest/vitest in `package.json` | **Neither present** |
| CI pipeline | `.github/workflows/` | **Does not exist** |
| Coverage tooling | jacoco (backend) / istanbul-nyc (frontend) | **Not configured** |

The only quality gate that runs today is **`next lint`** (ESLint via
`eslint-config-next`) on the frontend. The backend has no lint, format, or
test gate.

## What the toolchain *would* provide

If/when tests are added, the existing dependencies give a starting point:

### Backend — JUnit 5 (already on classpath)
`spring-boot-starter-test` (from `backend/pom.xml`) transitively brings:
- **JUnit 5** (Jupiter)
- **Mockito** (`@Mock`, `@InjectMocks`, `MockMvc`)
- **AssertJ** (fluent assertions)
- **Spring Test** (`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`)

No additional dependencies are required to start writing backend tests.

### Frontend — needs a runner
To add tests, install a runner (recommend **Vitest** for Vite/Next
compatibility and native ESM/TS support):
```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react
```
Zustand stores can also be unit-tested with Vitest in isolation (no DOM
needed).

## Recommended test plan (pragmatic, risk-ordered)

### Backend (highest value — money + auth paths)
1. **`@WebMvcTest(AuthController.class)`** — registration/login happy path,
   duplicate-email conflict (409), invalid payload → 400 validation, and the
   `/api/auth/admin/login` non-admin rejection (403). Use `@MockBean
   AuthService`.
2. **`@SpringBootTest` slice for `OrderService`** — place-order with
   insufficient stock (expect `InsufficientStockException`), coupon
   application/discount math, order-number generation uniqueness.
3. **`@DataJpaTest`** for repositories — `ProductRepository` search/category
   queries, `OrderRepository` status filters.
4. **`PaymentService`** — mock the Razorpay SDK; verify signature-verification
   happy path and the tampered-signature rejection path (security-critical).
5. **`SecurityConfig` integration test** — assert `/api/admin/**` is
   403-unreachable without an ADMIN token and that public routes
   (`/api/products/**`, `/api/auth/**`, `/api/payment/webhook`) are reachable
   unauthenticated.

### Frontend
6. **Unit tests for Zustand stores** (`store/authStore.ts`,
   `store/cartStore.ts`) — `addItem` merge behavior, `updateQuantity` → 0
   removes item, `total` shipping rule (`sub >= 499 ? 0 : 50`), coupon math,
   `logout` clears state + `localStorage`.
7. **Form validation schemas** (zod) — login/register/wholesale forms reject
   invalid email, short password, missing required fields.
8. **Component test** for `ProductCard.tsx` (renders name, price, "Add to
   cart" fires the expected store action).
9. **`lib/api.ts` interceptor test** — verify 401 response clears
   `localStorage["rm_token"]`/`["rm_user"]` and redirects to `/login`.

### CI / quality gates
10. Add a **GitHub Actions** workflow (`.github/workflows/ci.yml`) running:
    - Backend: `./mvnw -q test` (Java 17)
    - Frontend: `npm ci && npm run lint && (once added) npm run test`
    - Build smoke: `npm run build` to catch type errors.
11. Add **JaCoCo** (`mvn jacoco:report`) for backend coverage and fail the
    build below an agreed threshold on the `service`/`controller` packages.

## Why this matters here specifically
The most fragile and security-sensitive areas (per `CONCERNS.md`) — JWT
handling, payment verification, admin authorization, the custom error
envelope — are exactly the ones with **zero regression protection today**.
Adding tests for items 1, 4, and 5 above would cover the highest-risk paths
first.
