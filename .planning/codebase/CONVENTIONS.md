---
doc: CONVENTIONS
focus: quality
last_mapped: 2026-07-07
---

# Conventions — The Royal Mukhwas

Observed code style, patterns, and error-handling conventions, derived from
actual source (not aspirational). Backend = Spring Boot 3.2 / Java 17.
Frontend = Next.js 14 App Router / TypeScript (strict).

## Backend (Java / Spring)

### Package & layering
- Root package `com.royalmukhwas`, **package-by-layer**:
  `controller`, `service`, `repository`, `entity`, `dto`, `security`,
  `config`, `exception`, `util`.
- Class names carry a **role suffix** that matches their layer:
  `*Controller`, `*Service`, `*Repository`. Entities are bare domain nouns
  (`User`, `Product`, `Order`).
- Admin endpoints are isolated in a sub-package:
  `controller/admin/Admin*Controller.java`, all mounted under `/api/admin/**`.

### Lombok everywhere
Entities and DTOs are annotated with the full Lombok quartet for boilerplate
elimination. Example — `entity/User.java:11`:
```java
@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User { ... }
```
The DTO envelope uses `@Data @Builder @NoArgsConstructor @AllArgsConstructor`
(`dto/response/ApiResponse.java:8`). Constructor injection is done via
`@RequiredArgsConstructor` on `@RestController`/`@Service`/`@Configuration`
classes (e.g. `AuthController.java:13`, `SecurityConfig.java:27`).

### JPA entity conventions
- **UUID primary keys** generated via Hibernate:
  ```java
  @GeneratedValue(generator = "UUID")
  @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
  private UUID id;
  ```
- **Audit timestamps** via JPA lifecycle callbacks, not an auditing base class:
  ```java
  @PrePersist protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
  @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }
  ```
- **Relationships are lazy by default** with explicit `fetch = FetchType.LAZY`
  on `@ManyToOne`/`@OneToMany` (`entity/Product.java:20,63,66`). Collections
  use `cascade = CascadeType.ALL`.
- **Bilingual content** modeled as paired columns: `name` / `nameMarathi`,
  `description` / `descriptionMarathi`, `ingredients` / `ingredientsMarathi`,
  `benefits` / `benefitsMarathi` (`entity/Product.java:24-49`).
- DB column mapping is explicit (`@Column(name = "…")`) so camelCase fields
  map to the snake_case schema.

### API response envelope
All endpoints return `ResponseEntity<ApiResponse<T>>`. `ApiResponse<T>`
(`dto/response/ApiResponse.java`) is `{ success, message, data }` with static
factories:
```java
public static <T> ApiResponse<T> success(T data)                 { … }
public static <T> ApiResponse<T> success(String message, T data) { … }
public static <T> ApiResponse<T> error(String message)           { … }
```
Controllers stay thin and always use these factories — example,
`AuthController.java:20`:
```java
return ResponseEntity.ok(ApiResponse.success("Registration successful", authService.register(request)));
```

### Validation
- `spring-boot-starter-validation` is on the classpath; request DTOs are
  validated with Bean Validation annotations and bound at the controller with
  `@Valid` (e.g. `AuthController.java:19,24,31,36`):
  ```java
  public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) { … }
  ```

### Error handling (centralized)
- A **domain exception hierarchy** of static nested `RuntimeException`
  subclasses lives in `exception/CustomExceptions.java`:
  `ResourceNotFoundException`, `ConflictException`, `BadRequestException`,
  `ForbiddenException`, `PaymentException`, `InsufficientStockException`.
- A single `@RestControllerAdvice` — `GlobalExceptionHandler.java` — maps
  each to an HTTP status, always returning the `ApiResponse` envelope:
  - 404 `ResourceNotFoundException`, 409 `ConflictException`,
    400 `BadRequestException`, 403 `ForbiddenException` /
    `AccessDeniedException`, 401 `AuthenticationException`,
    400 `MethodArgumentNotValidException` (returns a `Map<field, message>`
    in `data`), 500 fallback for any other `Exception`.
- Services throw domain exceptions; controllers never build error responses
  manually.

### REST conventions
- Base paths: `/api/auth/**`, `/api/products/**`, `/api/categories/**`,
  `/api/banners/**`, `/api/orders/**`, `/api/payment/**`, `/api/cart/**`,
  `/api/addresses/**`, plus `/api/admin/**` (role-guarded).
- Standard verbs; pagination via `?page&size&sort` query params with sensible
  defaults (`ProductController.java:21-25`: `page=0`, `size=12`, `sort=newest`).
- Razorpay webhook endpoint `/api/payment/webhook` is public (`permitAll` in
  `SecurityConfig.java:47`).

### Security conventions
- **Stateless JWT**: `SessionCreationPolicy.STATELESS`, CSRF disabled, a
  custom `JwtFilter` registered before `UsernamePasswordAuthenticationFilter`
  (`SecurityConfig.java:38-54`).
- **Method security** enabled (`@EnableMethodSecurity`) so `@PreAuthorize` can
  be added per-method if needed.
- **BCrypt** password hashing via a `PasswordEncoder` bean.
- **Route-level authorization** in `SecurityConfig`: explicit `permitAll`
  list for public routes, `hasRole("ADMIN")` for `/api/admin/**`,
  `authenticated()` for everything else.

## Frontend (TypeScript / Next.js)

### TypeScript
- `strict: true` (`tsconfig.json:7`). Target `es5`, `moduleResolution:
  "bundler"`, `isolatedModules: true`.
- **Path alias** `@/*` → `./src/*` used consistently for imports
  (e.g. `app/layout.tsx:4-6`).
- Shared domain types centralized in `src/types/index.ts`.

### State — Zustand + persist
Both stores live in `src/store/` and use the `persist` middleware backed by
`localStorage`:
- `authStore.ts` — `{ user, token, isAuthenticated }` plus `setAuth` /
  `logout`. Persists under key `rm_auth`. Auth helpers also mirror the token
  into `localStorage["rm_token"]` so the Axios interceptor can read it.
- `cartStore.ts` — items + coupon/discount + **derived getters**
  (`subtotal`, `total`, `itemCount`). Shipping rule lives in the store:
  ```ts
  const shipping = sub >= 499 ? 0 : 50
  ```
  Persists under key `rm_cart`.

### API client pattern
A single Axios instance (`src/lib/api.ts`) holds:
- `baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'`
- a **request interceptor** that injects `Authorization: Bearer <jwt>` from
  `localStorage["rm_token"]` (guarded by `typeof window !== 'undefined'`),
- a **response interceptor** that, on a 401, clears auth keys and redirects
  to `/login`.
- Grouped API namespaces exported from the same file: `authApi`, `productApi`,
  `categoryApi`, `cartApi`, `orderApi`, `paymentApi`, `addressApi`,
  `bannerApi`, `adminApi`, `reviewApi`. **All endpoint paths are defined here**
  — components never hardcode URLs.

### Data fetching
- **SWR** for server-state reads; mutations via direct `api.*` calls followed
  by SWR revalidation/mutations.
- Server components fetch directly where possible; interactive pages delegate
  to a colocated client component (e.g. `app/products/page.tsx` renders
  `<ProductsClient />`).

### Forms & validation
- `react-hook-form` + `@hookform/resolvers/zod` for typed schemas. Schemas
  co-located with their forms (login, register, wholesale register,
  checkout).

### Styling
- **TailwindCSS 3.4** with a custom brand palette in `tailwind.config.js`:
  - `navy` (deep/mid), `cream` (DEFAULT/dark), `gold` (DEFAULT/light/pale)
  - Display fonts: `Playfair Display` (serif), `Inter` (sans),
    `Cormorant Garamond` (display)
  - Custom gradients `bg-gradient-royal` / `bg-gradient-gold`.
- Utility-class-first; the gold tone (`#c9a84c`) is also reused for toast
  success theming in `app/layout.tsx:46`.

### UX feedback
- **react-hot-toast** mounted once in the root layout (`<Toaster
  position="top-right" …/>`) — the standard way pages signal success/error
  to the user.

## Cross-stack error contract
Backend failures arrive at the frontend as Axios errors whose
`err.response.data` is an `ApiResponse` (`{ success, message, data? }`).
The conventional client handling is: read `message`, show it via
`react-hot-toast` (`toast.error(message)`), and rely on the 401 interceptor
to force re-login on auth expiry.

## Code-style notes / gaps
- No project-wide Java formatter config (spotless/checkstyle) is present —
  style is enforced by convention only.
- No ESLint/Prettier config beyond `eslint-config-next` defaults.
- Several API client methods use `data: any` rather than typed DTOs — type
  safety is strongest in the Zustand stores and weaker at the HTTP boundary.
