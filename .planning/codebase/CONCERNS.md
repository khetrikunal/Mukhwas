---
doc: CONCERNS
focus: concerns
last_mapped: 2026-07-07
---

# CONCERNS — Technical Debt, Security, Performance, Fragile Areas

Findings are grouped by severity. Each item cites real file paths and, where findable, line numbers. No issues were invented; greps for `TODO|FIXME|XXX|HACK` and `printStackTrace` in `backend/src` and `frontend/src` returned zero hits, which is itself noted below.

## Critical

- **Hardcoded live SMTP credential in version control.** `backend/src/main/resources/application.properties:28` ships a real Gmail app-password: `spring.mail.password=${MAIL_PASSWORD:ddnl lyom ltwg xsos}`. The default value (used when the env var is unset) is an actual secret, not a placeholder. The support address `theroyakmukhwassupport@gmail.com` is also hardcoded at line 27. **Why it matters:** anyone with repo read access can send mail as the brand and potentially abuse the Gmail account. **Remediation:** rotate the app password immediately, remove the default from the properties file (leave `${MAIL_PASSWORD:}` empty), and inject via environment/secret manager. Commit history still contains the secret, so rotation is mandatory regardless.

- **Weak/default secrets throughout `application.properties`.** `JWT_SECRET` defaults to `royalmukhwas-super-secret-key-change-in-production` (line 11), DB password defaults to `2504` (line 4 — appears to be a personal PIN), Cloudinary and Razorpay keys default to literal `your-cloud-name`/`your-api-key` placeholders (lines 16–22). `docker-compose.yml:29` sets `JWT_SECRET: change-this-in-production` and `POSTGRES_PASSWORD: password` (line 11). **Why it matters:** if env vars are ever unset in a deployed environment, the app silently runs with publicly-known weak secrets — JWTs become forgeable and the DB password is trivially guessable. **Remediation:** fail-fast at startup if `JWT_SECRET` is missing or below entropy threshold; never commit default secret values; use Docker secrets or `.env` files that are gitignored.

- **`.gitignore` does not cover several sensitive/stray paths.** `.gitignore` ignores `.env`, `*.class`, and `target/`, but does NOT ignore `application-local.properties`, `application-prod.properties`, `backend/Hash.java`, `backend/Hash.class`, or `*.bat`. The committed `Hash.class` and `Hash.java` (see below) prove `*.class` only catches top-level builds incompletely. **Remediation:** add explicit ignore entries and consider `git rm --cached` for anything already tracked.

- **Payment verification does a full table scan.** `backend/src/main/java/com/royalmukhwas/service/PaymentService.java:62` resolves the order by `orderRepository.findAll().stream().filter(o -> razorpayOrderId.equals(o.getRazorpayOrderId())).findFirst()` instead of a repository query. `OrderRepository` already defines custom `@Query` methods but has no `findByRazorpayOrderId`. **Why it matters:** every payment verification loads the entire `orders` table into memory; as order volume grows this becomes an O(n) memory and latency blowup on a hot, user-facing path, and a deadlock/OOM risk under concurrency. **Remediation:** add `Optional<Order> findByRazorpayOrderId(String razorpayOrderId)` to `OrderRepository` and use it.

## High

- **Razorpay webhook endpoint is a no-op stub.** `backend/src/main/java/com/royalmukhwas/controller/PaymentController.java:36-42` accepts `POST /api/payment/webhook`, reads `X-Razorpay-Signature`, but does not verify it and returns `OK` without processing any event (comment says "Verify signature, then update order status accordingly"). It is `permitAll` in `SecurityConfig.java:47`. **Why it matters:** payment state is only ever updated via the client-driven `/verify` path; async events (refunds, failed payments, disputes) are never reconciled server-side, and the open endpoint invites abuse. The HMAC verification logic exists in `PaymentService.verifyPayment` but is wired only to the client call, not the webhook. **Remediation:** implement signature verification + idempotent event handling in the webhook handler; record processed event IDs to avoid replays.

- **No idempotency guard on payment verification.** `PaymentService.verifyPayment` (lines 51-75) re-saves the order as `PAID`/`CONFIRMED` on every successful call. There is no check against an already-processed `razorpayPaymentId`. **Why it matters:** a replayed or duplicated `/verify` request could re-trigger downstream side effects (inventory decrement, confirmation emails) if those are added later, and currently provides no audit trail of duplicate attempts. **Remediation:** persist a unique constraint on `razorpay_payment_id` and short-circuit if already recorded.

- **Stray aggregate file `backend/src/main/java/com/royalmukhwas/repository/Repositories.java`.** The file exists but is 0 lines / empty (verified via `wc -l`). It sits alongside 8 legitimate per-entity repository interfaces and is not a Spring Data repository. **Why it matters:** dead file that signals abandoned refactoring; confusing to future readers expecting an aggregate registration point. **Remediation:** delete the file.

- **Stray `backend/Hash.java` and `backend/Hash.class`.** A standalone `main`-class hashing experiment (`new BCryptPasswordEncoder().encode("admin")`) living in `backend/` root, outside the Maven `src` tree and outside the `com.royalmukhwas` package. **Why it matters:** not part of any build; the `.class` is a committed binary; the hardcoded plaintext `"admin"` suggests someone was generating an admin password hash ad hoc. **Remediation:** delete both files; generate admin seeds via a proper migration or CLI command.

- **No structured logging anywhere in the backend.** Grep for `Logger`, `@Slf4j`, and `log.` across `backend/src/main/java/com/royalmukhwas/` returned zero matches; grep for `printStackTrace` and `System.out` in services also returned zero. Exceptions are caught and rethrown as messages (e.g. `PaymentService:73`) with no logging. **Why it matters:** in production there is no observability into auth failures, payment errors, Cloudinary upload failures, or unexpected exceptions — incidents will be un diagnosable. The total absence of both `printStackTrace` and proper logging means errors are silently swallowed into HTTP responses. **Remediation:** introduce `@Slf4j` (Lombok is already in use) across services and log at appropriate levels; configure a JSON log appender.

- **No Spring Boot Actuator (health/metrics).** `backend/pom.xml` does not include `spring-boot-starter-actuator` (only `spring-boot-starter-test` is present at line 36). **Why it matters:** no `/health`, `/info`, or `/metrics` endpoints for container orchestration, liveness/readiness probes, or operational monitoring. `docker-compose.yml` uses `restart: unless-stopped` with no healthcheck. **Remediation:** add actuator, expose only `/health` publicly, and add Docker `healthcheck` blocks.

- **Missing input validation on most controllers.** Only `AuthController` uses `@Valid` (lines 19, 24, 31, 36). All other controllers accept raw `@RequestBody Map<String, Object>` / `Map<String, String>` with no validation: `PaymentController` (lines 20, 27), `OrderController:25`, `AdminProductController:22,27`, `AdminOrderController:44`. **Why it matters:** `UUID.fromString(body.get("orderId"))` in `PaymentController:21` will throw `IllegalArgumentException` on malformed input (400 instead of clean validation error); admin product create/update accept untyped maps with no schema enforcement, enabling bad data to reach the DB. **Remediation:** define proper DTOs with Bean Validation annotations and `@Valid`.

## Medium

- **Dummy/mock data ships as production fallback.** `frontend/src/lib/dummyData.ts` is imported by `frontend/src/app/page.tsx:6`, `frontend/src/app/products/ProductsClient.tsx:7`, and `frontend/src/app/products/[slug]/page.tsx:9`. `ProductsClient.tsx:40-52` and `:53-65` fall back to `DUMMY_PRODUCTS` (with client-side filtering) whenever the API returns empty OR throws. **Why it matters:** real customers can be shown stale fictional products when the backend is degraded, leading to orders against non-existent inventory. This is not a dev-only path. **Remediation:** in production builds, show an error/empty state instead of mock data; gate dummy data behind `NODE_ENV==='development'`.

- **No automated tests.** `backend/src/test/` contains no test sources (only the starter test dependency in `pom.xml:36`); `frontend/src/test/` and `frontend/__tests__/` do not exist. **Why it matters:** payment logic, JWT handling, and order flows have no regression coverage; the `findAll().stream()` bug above is exactly the kind of issue tests would catch. **Remediation:** add unit tests for `PaymentService`, `JwtUtil`, and order placement; integration tests for auth and payment flows.

- **No CI/CD pipeline.** `.github/workflows/` does not exist. **Why it matters:** no automated build/test/lint gate; broken commits can reach main. **Remediation:** add a GitHub Actions workflow running `mvn test`, `npm run lint`/`build`, and (later) tests.

- **`@OneToMany` mappings are LAZY but no fetch planning visible.** `Order.java:75` (order items), `Product.java:63` (images) and `Product.java:66` (variants) all use `FetchType.LAZY` with `CascadeType.ALL` — good defaults — but serializers/controllers were not confirmed to use DTOs or `@Transactional` read boundaries, so lazy initialization exceptions or N+1 serialization are latent risks. **Remediation:** ensure all entity-to-JSON crossing points use DTO projection or `@EntityGraph`.

- **Dev/prod configuration coupling in `docker-compose.yml`.** Ports `5432` (Postgres), `8080` (backend), `3000` (frontend) are all published to the host; `CORS_ORIGINS: http://localhost:3000` is hardcoded (line 30) rather than templated. Fine for local dev, not production-hardened. **Remediation:** provide a separate `docker-compose.prod.yml` override that does not publish Postgres and sources `CORS_ORIGINS` from env.

## Low

- **Temporary/dev helper files committed to root.** `TEMP_CHECK_VIDEO_BACKGROUND.md`, `copy_images.bat`, `start-backend.bat`, and `TODO.md` all live in the repo root. `TODO.md` tracks an open video-background investigation (hero video in `frontend/src/app/page.tsx`, MP4 location in `frontend/src/assets/` vs `public/`). **Why it matters:** clutter; `.bat` files are Windows-only dev aids; `TEMP_CHECK_VIDEO_BACKGROUND.md` is explicitly temporary. **Remediation:** remove or move to a `scripts/` + `docs/` structure; resolve the open TODO in `TODO.md`.

- **`Repositories.java` naming confusion.** Even when empty, an aggregate-named file in a per-interface repository package is a code smell that suggests an intended (but never built) aggregate registration pattern. **Remediation:** delete (see High).

- **`spring.jpa.hibernate.ddl-auto=update`** (`application.properties:5`). Acceptable for early development but risky in production — schema drift, no migration history. **Remediation:** switch to `validate` in prod and manage schema via Flyway/Liquibase.

- **`springdoc` Swagger UI exposed in default config.** `application.properties:48-49` enables `/swagger-ui.html` and `/api-docs`, and `SecurityConfig.java:48-49` permits them publicly. Useful in dev, but in production this leaks the full API surface to attackers. **Remediation:** gate Swagger behind a profile or admin role in production.
