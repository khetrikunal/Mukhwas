---
doc: STRUCTURE
focus: arch
last_mapped: 2026-07-07
---

# Structure — The Royal Mukhwas

## Top-level layout

```
The-Royal-Mukhwas/
├── README.md                      # Project overview
├── TODO.md                        # Open todos
├── TEMP_CHECK_VIDEO_BACKGROUND.md # Dev scratch file (see CONCERNS.md)
├── docker-compose.yml             # postgres + backend + frontend services
├── copy_images.bat                # Windows helper: bulk-copy product images
├── start-backend.bat              # Windows helper: run Spring Boot locally
├── .gitignore
├── database/
│   └── schema_and_seed.sql        # Postgres DDL + seed data (~25 KB)
├── backend/                       # Spring Boot 3.2 (Java 17, Maven)
└── frontend/                      # Next.js 14 (TypeScript, Tailwind)
```

## Backend — `backend/`

```
backend/
├── pom.xml                                # Maven build (Spring Boot 3.2 parent)
├── Dockerfile
├── Hash.java / Hash.class                 # ⚠ Stray untracked files in root — NOT part of Maven build (see CONCERNS.md)
├── target/                                # Build output (gitignored)
└── src/main/
    ├── resources/
    │   └── application.properties         # Datasource, JWT, Cloudinary, Razorpay, mail config
    └── java/com/royalmukhwas/
        ├── RoyalMukhwasApplication.java   # @SpringBootApplication entry point (@EnableScheduling)
        ├── config/
        │   ├── AppConfig.java             # Beans (Cloudinary, model mappers, etc.)
        │   └── SecurityConfig.java        # SecurityFilterChain, CORS, PasswordEncoder
        ├── controller/                    # Public REST endpoints
        │   ├── AuthController.java        #   /api/auth/**
        │   ├── ProductController.java     #   /api/products/**
        │   ├── OrderController.java       #   /api/orders/**
        │   ├── PaymentController.java     #   /api/payment/**
        │   ├── BannerController.java      #   /api/banners/**
        │   └── admin/                     #   /api/admin/** (role = ADMIN)
        │       ├── AdminDashboardController.java
        │       ├── AdminOrderController.java
        │       └── AdminProductController.java
        ├── dto/
        │   ├── request/                   # Inbound: LoginRequest, RegisterRequest, WholesaleRegisterRequest
        │   └── response/                  # Outbound: ApiResponse<T>, AuthResponse
        ├── entity/                        # JPA @Entity domain model
        │   ├── User.java
        │   ├── Address.java
        │   ├── WholesaleProfile.java
        │   ├── Product.java
        │   ├── ProductVariant.java
        │   ├── ProductImage.java
        │   ├── Category.java
        │   ├── Order.java
        │   ├── OrderItem.java
        │   ├── Coupon.java
        │   ├── Banner.java
        │   └── Review.java
        ├── exception/
        │   ├── CustomExceptions.java      # Domain exception hierarchy (static nested classes)
        │   └── GlobalExceptionHandler.java# @RestControllerAdvice → ApiResponse
        ├── repository/                    # Spring Data JPA interfaces
        │   ├── UserRepository.java
        │   ├── ProductRepository.java
        │   ├── ProductVariantRepository.java
        │   ├── CategoryRepository.java
        │   ├── OrderRepository.java
        │   ├── CouponRepository.java
        │   ├── AddressRepository.java
        │   ├── BannerRepository.java
        │   ├── WholesaleProfileRepository.java
        │   └── Repositories.java          # ⚠ Near-empty placeholder (see CONCERNS.md)
        ├── security/
        │   ├── JwtUtil.java               # Token create/parse/validate
        │   ├── JwtFilter.java             # OncePerRequestFilter, injects auth
        │   └── UserDetailsServiceImpl.java# Loads users for Spring Security
        ├── service/                       # Business logic (@Service)
        │   ├── AuthService.java
        │   ├── ProductService.java
        │   ├── OrderService.java
        │   ├── PaymentService.java
        │   ├── CloudinaryService.java     # Image uploads
        │   └── EmailService.java          # Transactional email
        └── util/
            ├── OrderNumberGenerator.java
            └── SlugGenerator.java
```

> **Note**: there is **no** `backend/src/test/` directory — the project has no
> backend tests today (see TESTING.md).

## Frontend — `frontend/`

```
frontend/
├── package.json                  # Next 14.2, React 18, TS, Tailwind, Zustand, Axios, SWR, Razorpay
├── package-lock.json
├── next.config.js
├── tsconfig.json                 # strict: true, path alias @/* → ./src/*
├── tailwind.config.js            # brand palette: navy / cream / gold
├── postcss.config.js
├── Dockerfile
├── .env.local.example            # NEXT_PUBLIC_API_URL template
├── next-env.d.ts
├── Public/                       # Static assets (logo, favicon, etc.)
├── node_modules/                 # (gitignored)
├── .next/                        # Build output (gitignored)
└── src/
    ├── app/                      # Next.js App Router — one folder per route
    │   ├── layout.tsx            # Root layout: Navbar + Footer + Toaster + WhatsAppFloat
    │   ├── page.tsx              # Home
    │   ├── globals.css
    │   ├── about/page.tsx
    │   ├── products/
    │   │   ├── page.tsx          # Server page
    │   │   ├── ProductsClient.tsx# Client component (filters, search state)
    │   │   └── [slug]/page.tsx   # Product detail
    │   ├── cart/page.tsx
    │   ├── checkout/page.tsx
    │   ├── order-success/[id]/page.tsx
    │   ├── track-order/page.tsx
    │   ├── contact/page.tsx
    │   ├── branches/page.tsx
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   ├── register/wholesale/page.tsx
    │   ├── account/page.tsx
    │   ├── account/orders/page.tsx
    │   └── admin/
    │       ├── dashboard/page.tsx
    │       └── orders/page.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   └── Footer.tsx
    │   ├── product/
    │   │   └── ProductCard.tsx
    │   ├── ui/
    │   │   └── WhatsAppFloat.tsx
    │   └── common/
    │       └── CompanyName1824.tsx
    ├── lib/
    │   ├── api.ts                # Axios instance + grouped API objects (authApi, productApi, …)
    │   ├── branding.ts           # Brand identity constants
    │   └── dummyData.ts          # Mock/fallback data (see CONCERNS.md)
    ├── store/
    │   ├── authStore.ts          # Zustand + persist → localStorage["rm_auth"]
    │   └── cartStore.ts          # Zustand + persist → localStorage["rm_cart"]
    ├── types/
    │   └── index.ts              # Shared TS types
    └── assets/
        └── product/              # Local product imagery
```

## Database — `database/`

- `schema_and_seed.sql` — single-file Postgres DDL (tables, constraints,
  indexes) plus seed rows (categories, sample products, banners, admin user,
  coupons). Mounted into the Postgres container as the Docker entrypoint init
  script (`docker-compose.yml`).

## Naming conventions observed

| Domain | Convention | Examples |
|--------|-----------|----------|
| Java classes | PascalCase + role suffix | `ProductController`, `AuthService`, `UserRepository`, `Order` entity |
| Java packages | lowercase, package-by-layer | `com.royalmukhwas.{controller,service,repository,entity,…}` |
| Java fields/vars | camelCase | `passwordHash`, `createdAt`, `isFeatured` |
| DB columns | snake_case | `password_hash`, `created_at`, `is_active` |
| REST URLs | lowercase, kebab-ish, plural nouns | `/api/products`, `/api/orders`, `/api/admin/orders` |
| TS components | PascalCase `.tsx` | `ProductCard.tsx`, `WhatsAppFloat.tsx` |
| TS modules | camelCase `.ts` | `api.ts`, `authStore.ts`, `dummyData.ts` |
| Route folders | kebab-case | `order-success/`, `track-order/` |
| Zustand stores | `*Store.ts` | `authStore.ts`, `cartStore.ts` |
| localStorage keys | `rm_*` prefix | `rm_token`, `rm_user`, `rm_auth`, `rm_cart` |
| Path alias | `@/*` → `./src/*` | `import api from '@/lib/api'` |

## Build artifacts (gitignored, do not edit)
- `frontend/.next/` — Next build output
- `frontend/node_modules/` — JS deps
- `backend/target/` — Maven build output
- `backend/Hash.java` / `backend/Hash.class` — **stray, untracked**, not part
  of the Maven build; flagged for cleanup (see CONCERNS.md).
