---
doc: INTEGRATIONS
focus: tech
last_mapped: 2026-07-07
---

# External Integrations & Services

The Royal Mukhwas backend (Spring Boot 3) integrates with five external systems: PostgreSQL, JWT (self-issued), Cloudinary (image storage), Razorpay (payments), and SMTP email (Gmail). The frontend talks to the backend over a typed Axios client and loads Razorpay's hosted checkout directly. There is also a static WhatsApp deep-link.

## Integration Map

| Integration | Direction | Layer | Library / SDK |
|-------------|-----------|-------|---------------|
| PostgreSQL 15 | Backend → DB | Data | `postgresql` JDBC driver + Spring Data JPA |
| JWT Auth | Browser ↔ Backend | Security | `jjwt 0.11.5` (server); `Bearer` header (client) |
| Cloudinary | Backend → CDN | Storage | `cloudinary-http44 1.34.0` |
| Razorpay | Browser + Backend → Gateway | Payments | `razorpay-java 1.4.3` (server), `razorpay 2.9.2` + checkout.js (client) |
| Gmail SMTP | Backend → Mail | Notifications | `spring-boot-starter-mail` |
| WhatsApp | Browser → wa.me | Contact | plain `<a href>` deep link |

## 1. PostgreSQL Database

- **Config:** `backend/src/main/resources/application.properties` lines 1-8.
  - URL: `jdbc:postgresql://${DB_HOST:localhost}:5432/${DB_NAME:mukhwas}` (note: compose service DB is `royalmukhwas`; properties default is `mukhwas`).
  - Dialect: `org.hibernate.dialect.PostgreSQLDialect`.
  - DDL: `spring.jpa.hibernate.ddl-auto=update`.
- **Credentials env vars (names only):** `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- **Compose:** `docker-compose.yml` mounts `database/schema_and_seed.sql` → `/docker-entrypoint-initdb.d/init.sql` for first-run seeding.
- **Schema:** 12 tables (see STACK.md). Access via Spring Data JPA repositories under `backend/src/main/java/com/royalmukhwas/repository/`.

## 2. JWT Authentication

- **Server util:** `backend/src/main/java/com/royalmukhwas/security/JwtUtil.java`
  - Signs tokens with `Keys.hmacShaKeyFor(secret.getBytes())` using `SignatureAlgorithm.HS256`.
  - Access token carries a custom `role` claim; refresh token is role-less.
  - Expirations: access 24h (`jwt.expiration=86400000`), refresh 7d (`jwt.refresh-expiration=604800000`).
- **Filter:** `backend/src/main/java/com/royalmukhwas/security/JwtFilter.java` extends `OncePerRequestFilter`. Reads `Authorization: Bearer <token>`, extracts username, validates against `UserDetailsServiceImpl`, and seeds the `SecurityContextHolder`. Failures are swallowed silently (token ignored).
- **Security wiring:** `backend/src/main/java/com/royalmukhwas/config/SecurityConfig.java`
  - Stateless sessions (`SessionCreationPolicy.STATELESS`), CSRF disabled, CORS enabled.
  - Public: `/api/auth/**`, `/api/products/**`, `/api/categories/**`, `/api/banners/**`, `/api/payment/webhook`, Swagger paths.
  - `/api/admin/**` requires `ROLE_ADMIN`; everything else authenticated.
  - `BCryptPasswordEncoder` bean for password hashing.
- **Client side:** `frontend/src/lib/api.ts` — Axios request interceptor reads `localStorage['rm_token']` and sets `Authorization: Bearer`. A response interceptor clears `rm_token`/`rm_user` and redirects to `/login` on any 401.
- **Secret env var:** `JWT_SECRET`.

## 3. Cloudinary Image Storage

- **Bean:** `backend/src/main/java/com/royalmukhwas/config/AppConfig.java` constructs `Cloudinary` with `cloud_name`, `api_key`, `api_secret`, `secure=true`.
- **Service:** `backend/src/main/java/com/royalmukhwas/service/CloudinaryService.java`
  - `uploadImage(MultipartFile, folder)` → uploads bytes to `royal-mukhwas/<folder>`, returns `{ url: secure_url, publicId }` (auto quality/format).
  - `deleteImage(publicId)` via `cloudinary.uploader().destroy(...)`.
- **Frontend image domains:** `frontend/next.config.js` whitelists `res.cloudinary.com` and `images.unsplash.com` for `next/image`.
- **Env vars:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (backend); `NEXT_PUBLIC_CLOUDINARY_NAME` (frontend example only).

## 4. Razorpay Payments

End-to-end Razorpay order flow with server-side order creation, client-side hosted checkout, and HMAC-SHA256 signature verification.

- **Bean:** `backend/src/main/java/com/royalmukhwas/config/AppConfig.java` → `new RazorpayClient(keyId, keySecret)`.
- **Server service:** `backend/src/main/java/com/royalmukhwas/service/PaymentService.java`
  - `createRazorpayOrder(orderId)` — amount computed in paise (`totalAmount × 100`), currency `INR`, receipt = order number; persists `razorpayOrderId` on the `Order` entity.
  - `verifyPayment(orderId, paymentId, signature)` — recomputes `HmacSHA256(razorpayOrderId|razorpayPaymentId)` with the key secret, hex-compares to the signature; on match marks order `PAID` + `CONFIRMED` and stores `razorpayPaymentId`.
- **Controller:** `backend/src/main/java/com/royalmukhwas/controller/PaymentController.java` (`/api/payment`)
  - `POST /create-order`, `POST /verify`, and a stub `POST /webhook` (accepts `X-Razorpay-Signature` header; body not yet processed — returns "OK").
- **Client checkout:** `frontend/src/app/checkout/page.tsx`
  - Dynamically injects `https://checkout.razorpay.com/v1/checkout.js`.
  - Calls `paymentApi.createOrder`, opens `new window.Razorpay({...})` with `key`, `amount`, `order_id`, gold theme `#c9a84c`, then calls `paymentApi.verify` in the handler.
  - COD path supported separately (orders ≤ ₹2000 per `app.cod-max-amount`).
- **Env vars:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (backend); `NEXT_PUBLIC_RAZORPAY_KEY_ID` (frontend).

## 5. Email (Gmail SMTP)

- **Config:** `application.properties` lines 24-30 — `smtp.gmail.com:587`, SMTP auth + STARTTLS enabled.
- **Service:** `backend/src/main/java/com/royalmukhwas/service/EmailService.java` — sends HTML email via `JavaMailSender` + `MimeMessageHelper`. Branded wrapper template uses the royal navy/gold palette and legal footer (`1824 Vituraya Ventures Private Limited`, Baramati). All sends are `@Async` and failures are logged to stderr (swallowed) so email never breaks business flows.
- **Templates:** order confirmation, order shipped, welcome, wholesale approval.
- **Env vars:** `MAIL_USERNAME`, `MAIL_PASSWORD` (configured as a Gmail App Password).

## 6. WhatsApp Contact (Static)

- **Component:** `frontend/src/components/ui/WhatsAppFloat.tsx` — fixed bottom-right circular button (WhatsApp green `#25D366`) rendering inline SVG.
- **Link source:** `frontend/src/lib/branding.ts` → `WHATSAPP_LINK = https://wa.me/9156996309` with a pre-filled `?text=` order message.
- No backend involvement; purely a `wa.me` deep link to the business number `+91 9156996309`.

## 7. Frontend ↔ Backend API Client

- **File:** `frontend/src/lib/api.ts` — single Axios instance, `baseURL = NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).
- **Token handling:** request interceptor injects Bearer JWT; response interceptor force-logout on 401.
- **Grouped API modules:** `authApi`, `productApi`, `categoryApi`, `cartApi`, `orderApi`, `paymentApi`, `addressApi`, `bannerApi`, `adminApi`, `reviewApi` — covering every backend endpoint group.
- **Image upload:** `productApi.uploadImage` sends `multipart/form-data` to `/api/admin/products/{id}/images`.
- **CORS:** backend allows origins from `CORS_ORIGINS` (default `http://localhost:3000`), all standard methods, credentials allowed.

## Environment Variables (Names Only)

| Variable | Used By |
|----------|---------|
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Backend (datasource) |
| `JWT_SECRET` | Backend (auth) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Backend (storage) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Backend (payments) |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Backend (email) |
| `CORS_ORIGINS`, `FRONTEND_URL` | Backend (CORS / links) |
| `NEXT_PUBLIC_API_URL` | Frontend (API base) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Frontend (checkout key) |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | Frontend (.env.local.example only) |

**Note:** `application.properties` ships with hardcoded default values for several secrets (DB password, JWT secret, Cloudinary/Razorpay placeholders, Gmail app password). These should be overridden via real environment variables in any non-local deployment.

## Webhooks

- `POST /api/payment/webhook` (`PaymentController`) is registered and whitelisted as public in `SecurityConfig`, but the handler body is a stub — it reads the `X-Razorpay-Signature` header and payload but does not yet verify or act on Razorpay events (`payment.captured`, etc.). Signature verification currently happens only via the client-driven `/verify` flow.
- No other inbound webhooks exist in the codebase.
