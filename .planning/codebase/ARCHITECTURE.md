---
doc: ARCHITECTURE
focus: arch
last_mapped: 2026-07-07
---

# Architecture — The Royal Mukhwas

E-commerce platform for an Indian mukhwas / mouth-freshener brand. Two-tier,
decoupled **client/server** architecture: a Next.js 14 storefront (App Router)
talking to a Spring Boot 3.2 REST API backed by PostgreSQL. Frontend and
backend are independently deployable containers orchestrated by Docker
Compose (`docker-compose.yml`).

## High-Level Pattern

Classic **Layered N-tier** on the backend, **route-based component tree** on
the frontend, communicating exclusively over JSON REST.

```
┌──────────────────────────┐        JSON/HTTPS (JWT)        ┌──────────────────────────┐
│  Frontend (Next.js 14)   │  ────────────────────────────► │   Backend (Spring Boot)  │
│  App Router · TS · Zustand│  ◄──────────────────────────── │   REST · JPA · Security   │
└──────────────────────────┘                                └─────────────┬────────────┘
       SWR + Axios (`lib/api.ts`)                                         │ JDBC
                                                                         ▼
                                                              ┌────────────────────┐
                                                              │   PostgreSQL 15    │
                                                              │  (schema + seed)   │
                                                              └────────────────────┘
```

---

## Backend — Layered Spring Boot (Java 17, package `com.royalmukhwas`)

### Entry point
- `backend/src/main/java/com/royalmukhwas/RoyalMukhwasApplication.java` —
  `@SpringBootApplication` + `@EnableScheduling` (scheduled jobs are wired,
  e.g. order expiry / cleanup).

### Layers (Controller → Service → Repository → Entity)

| Layer | Location | Pattern |
|-------|----------|---------|
| Controller | `controller/`, `controller/admin/` | `@RestController`, thin, delegate to service |
| Service | `service/` | `@Service` beans, business logic, transactions |
| Repository | `repository/` | Spring Data JPA interfaces (`JpaRepository`) |
| Entity | `entity/` | `@Entity` JPA domain models (Lombok-annotated) |
| DTO | `dto/request/`, `dto/response/` | Inbound/outbound contracts |
| Security | `security/` + `config/SecurityConfig.java` | JWT filter chain |
| Cross-cutting | `exception/`, `util/` | `@ControllerAdvice`, helpers |

**Public controllers** (`controller/`):
- `AuthController.java` — `/api/auth/{register,register/wholesale,login,admin/login}`
- `ProductController.java` — `/api/products` (paginated, filter by category/search, featured, by-slug)
- `OrderController.java` — `/api/orders` (place, list, by-order-number, cancel)
- `PaymentController.java` — `/api/payment/{create-order,verify,webhook}`
- `BannerController.java` — `/api/banners`

**Admin controllers** (`controller/admin/`, all under `/api/admin/**`):
- `AdminDashboardController.java` — stats, recent orders, reports
- `AdminOrderController.java` — list, status updates, wholesale orders
- `AdminProductController.java` — product/variant/category CRUD + image upload

**Services**: `AuthService`, `ProductService`, `OrderService`, `PaymentService`,
`CloudinaryService` (image storage), `EmailService` (transactional mail).

**Repositories**: one `JpaRepository` per aggregate root — `UserRepository`,
`ProductRepository`, `ProductVariantRepository`, `OrderRepository`,
`CategoryRepository`, `CouponRepository`, `AddressRepository`,
`BannerRepository`, `WholesaleProfileRepository`. (`Repositories.java` is a
near-empty placeholder — see CONCERNS.md.)

### Domain model (entities)
Core aggregates and their relationships:

- **User** `entity/User.java` — UUID PK, roles enum `ADMIN/CUSTOMER/WHOLESALE`,
  flags `isVerified`, `isActive`. Audit timestamps via `@PrePersist/@PreUpdate`.
- **Address** `entity/Address.java` → belongs to User.
- **Product** `entity/Product.java` — slug, bilingual fields (`name`/`nameMarathi`,
  `description`/`descriptionMarathi`, etc.), `@ManyToOne Category` (lazy),
  `@OneToMany` → `ProductVariant` and `ProductImage` (lazy, cascade ALL).
- **ProductVariant** — purchasable unit (weight/price).
- **Category** — product grouping, slug-based.
- **Order** + **OrderItem** — order aggregate; `Order` has order-number + status.
- **Coupon** — discount codes.
- **Banner** — homepage/hero imagery.
- **Review** — product reviews (admin-approved).
- **WholesaleProfile** — B2B applicant data attached to a WHOLESALE user.

All entities use **UUID string PKs** generated via
`@GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")`.

### Auth / request flow (JWT, stateless)
1. Client authenticates via `POST /api/auth/login` → returns `AuthResponse`
   containing a JWT.
2. Client stores token in `localStorage` (`rm_token`) — see
   `frontend/src/lib/api.ts:11-17`, attaches as `Authorization: Bearer <jwt>`.
3. Each secured request passes through `JwtFilter` (registered before
   `UsernamePasswordAuthenticationFilter` in `SecurityConfig.java:54`) which
   validates the token via `JwtUtil` and loads the user through
   `UserDetailsServiceImpl`.
4. `SessionCreationPolicy.STATELESS` — no server-side HTTP sessions.

### API response envelope
Every endpoint wraps payloads in `ApiResponse<T>` (`dto/response/ApiResponse.java`):
`{ success: boolean, message: string, data: T }` with static factories
`success(...)`, `error(...)`. Validation/errors are centralized in
`GlobalExceptionHandler` (see CONVENTIONS.md).

---

## Frontend — Next.js 14 App Router (TypeScript)

### Routing (`frontend/src/app/`)
One folder = one route:

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` | Home (hero, featured products, banners) |
| `/about` | `app/about/page.tsx` | |
| `/products` | `app/products/page.tsx` + `ProductsClient.tsx` | server page wraps a **client** component |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | product detail |
| `/cart` | `app/cart/page.tsx` | reads Zustand cart store |
| `/checkout` | `app/checkout/page.tsx` | Razorpay flow |
| `/order-success/[id]` | `app/order-success/[id]/page.tsx` | |
| `/track-order` | `app/track-order/page.tsx` | lookup by order number |
| `/contact`, `/branches` | respective `page.tsx` | |
| `/login`, `/register`, `/register/wholesale` | respective `page.tsx` | auth |
| `/account`, `/account/orders` | respective `page.tsx` | customer area |
| `/admin/dashboard`, `/admin/orders` | respective `page.tsx` | admin area |

Root layout `app/layout.tsx` mounts global `Navbar`, `Footer`,
`WhatsAppFloat`, and the react-hot-toast `<Toaster>`.

### State management
- **Zustand stores** in `frontend/src/store/`, both using the `persist`
  middleware backed by `localStorage`:
  - `authStore.ts` — `{ user, token, isAuthenticated }`, persisted as `rm_auth`.
  - `cartStore.ts` — items, coupon, derived getters (`subtotal`, `total`
    with shipping logic, `itemCount`), persisted as `rm_cart`.
- Server data fetched via **SWR** + the Axios client in `lib/api.ts`.

### Data flow
```
React component/page
   │
   ├── (client state)  useAuthStore / useCartStore   ← Zustand (localStorage)
   │
   └── (server data)   productApi.* / orderApi.*     ← lib/api.ts (Axios + JWT interceptor)
                                                          │
                                                          ▼
                                               Spring Boot REST (port 8080)
                                                          │
                                                          ▼
                                                    PostgreSQL
```

`lib/api.ts` exports grouped API objects (`authApi`, `productApi`, `orderApi`,
`cartApi`, `paymentApi`, `addressApi`, `bannerApi`, `adminApi`, `reviewApi`,
`categoryApi`) — the single source of truth for endpoint paths on the client.

### Component organization
- `components/layout/` — `Navbar.tsx`, `Footer.tsx`
- `components/product/` — `ProductCard.tsx`
- `components/ui/` — `WhatsAppFloat.tsx`
- `components/common/` — `CompanyName1824.tsx`
- `types/index.ts` — shared TypeScript types
- `lib/branding.ts` — brand identity constants
- `lib/dummyData.ts` — fallback/mock data (see CONCERNS.md)

---

## Cross-cutting concerns

- **CORS**: backend reads `app.cors.allowed-origins` (set via
  `CORS_ORIGINS` env in `docker-compose.yml` → `http://localhost:3000`) and
  configures allowed methods + credentials in `SecurityConfig.corsConfigurationSource()`.
- **Internationalization**: bilingual product content (English + Marathi columns)
  at the data layer; not yet a full i18n framework on the frontend.
- **Payments**: Razorpay order creation + verification round-trip
  (`PaymentController` ↔ `PaymentService` ↔ Razorpay SDK) with a webhook
  endpoint (`/api/payment/webhook`).
- **Media**: product images uploaded to Cloudinary via `CloudinaryService`.

## Entry points (quick reference)
- Backend boot: `RoyalMukhwasApplication.main()`
- Frontend boot: `frontend/src/app/layout.tsx` → `app/page.tsx`
- Container orchestration: `docker-compose.yml` (postgres :5432, backend :8080, frontend :3000)
