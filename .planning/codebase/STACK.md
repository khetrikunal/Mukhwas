---
doc: STACK
focus: tech
last_mapped: 2026-07-07
---

# Tech Stack & Dependencies

The Royal Mukhwas is a full-stack Indian e-commerce application (mouthfreshener/mukhwas store). It is split into a Next.js 14 frontend, a Spring Boot 3 backend, and a PostgreSQL database, all orchestrated via Docker Compose.

## High-Level Architecture

| Layer | Technology | Build Tool |
|-------|-----------|------------|
| Frontend | Next.js 14.2 (App Router) + React 18 + TypeScript 5 | npm / Docker (node:20-alpine) |
| Backend | Spring Boot 3.2.0 + Java 17 | Maven / Docker (eclipse-temurin-17) |
| Database | PostgreSQL 15 | docker-compose (postgres:15-alpine) |
| Orchestration | Docker Compose v3.8 | `docker-compose.yml` (3 services) |

## Frontend Stack

Source: `frontend/package.json`

### Core Frameworks
- **Next.js** `14.2.0` (App Router) — `frontend/next.config.js` configures Cloudinary/Unsplash image domains and exposes `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` env vars.
- **React** `^18.3.0` / **react-dom** `^18.3.0`
- **TypeScript** `^5` — strict mode, target `es5`, `moduleResolution: bundler`, `@/*` path alias → `./src/*` (`frontend/tsconfig.json`).

### State & Data Fetching
- **Zustand** `^4.5.2` — client state (cart, auth).
- **Axios** `^1.7.2` — HTTP client (`frontend/src/lib/api.ts`).
- **SWR** `^2.2.5` — data fetching/caching.

### Forms & Validation
- **react-hook-form** `^7.52.0` + **@hookform/resolvers** `^3.6.0`.
- **zod** `^3.23.8` — schema validation.

### UI / Icons / Utilities
- **TailwindCSS** `^3.4.4` (`frontend/tailwind.config.js`) — custom royal theme palette (`navy`, `cream`, `gold`), royal/gold gradients, Playfair Display + Inter + Cormorant Garamond fonts. Processed via `frontend/postcss.config.js` (tailwindcss + autoprefixer).
- **lucide-react** `^0.383.0` — icons.
- **clsx** `^2.1.1` — conditional classnames.
- **react-hot-toast** `^2.4.1` — notifications.
- **razorpay** `^2.9.2` — client-side checkout SDK wrapper.

### Dev Tooling
- **eslint** `^8` + **eslint-config-next** `14.2.0`.
- **@types/node** `^20`, **@types/react** / **@types/react-dom** `^18`.
- **postcss** `^8`, **autoprefixer** `^10`.

Scripts (`frontend/package.json`): `dev` → `next dev`, `build` → `next build`, `start` → `next start`, `lint` → `next lint`.

## Backend Stack

Source: `backend/pom.xml`

### Core
- **Spring Boot** parent `3.2.0` (`com.royalmukhwas:royal-mukhwas-backend:1.0.0`).
- **Java** `17`.

### Spring Starters
| Starter | Purpose |
|---------|---------|
| `spring-boot-starter-web` | REST controllers |
| `spring-boot-starter-data-jpa` | ORM / repositories |
| `spring-boot-starter-security` | Auth, CORS, password encoding |
| `spring-boot-starter-validation` | Bean validation |
| `spring-boot-starter-mail` | SMTP email |

### Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| `io.jsonwebtoken:jjwt-api/impl/jackson` | `0.11.5` | JWT auth |
| `org.postgresql:postgresql` | (managed) | Postgres JDBC driver |
| `com.cloudinary:cloudinary-http44` | `1.34.0` | Image upload/CDN |
| `com.razorpay:razorpay-java` | `1.4.3` | Payments |
| `org.projectlombok:lombok` | (managed) | Boilerplate reduction |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui` | `2.2.0` | Swagger UI at `/swagger-ui.html` |
| `spring-boot-starter-test` | (test scope) | Testing |

Maven config (`backend/pom.xml`): `spring-boot-maven-plugin` excludes Lombok from the final jar.

## Database

Source: `database/schema_and_seed.sql` (452 lines, ~25 KB)

- **PostgreSQL 15** (Alpine image via `docker-compose.yml`).
- Uses `pgcrypto` extension for `gen_random_uuid()`.
- **DDL strategy:** `spring.jpa.hibernate.ddl-auto=update` (`backend/src/main/resources/application.properties`) — Hibernate manages schema diff at runtime; the SQL file is mounted as the docker init script only.
- **12 tables:** `users`, `wholesale_profiles`, `categories`, `products`, `product_variants`, `product_images`, `addresses`, `orders`, `order_items`, `coupons`, `banners`, `reviews`.
- **Seed data:** 61 `INSERT` statements (categories, products, variants, banners).

## Runtime Versions

| Component | Version | Source |
|-----------|---------|--------|
| Node.js | 20 (alpine) | `frontend/Dockerfile` |
| Java JDK/JRE | 17 (eclipse-temurin) | `backend/Dockerfile`, `backend/pom.xml` |
| Maven | 3.9 | `backend/Dockerfile` |
| PostgreSQL | 15 (alpine) | `docker-compose.yml` |
| npm | (bundled with Node 20) | `frontend/Dockerfile` |

## Infra / DevOps

- **`docker-compose.yml`** (v3.8) — 3 services:
  - `postgres` (`postgres:15-alpine`, container `royalmukhwas-db`, port 5432) — mounts `database/schema_and_seed.sql` as `/docker-entrypoint-initdb.d/init.sql`; named volume `pgdata`.
  - `backend` (built from `./backend`, port 8080) — depends on `postgres`; injects `DB_HOST`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`.
  - `frontend` (built from `./frontend`, port 3000) — depends on `backend`; injects `NEXT_PUBLIC_API_URL`.
- **`backend/Dockerfile`** — multi-stage: `maven:3.9-eclipse-temurin-17` build → `eclipse-temurin:17-jre-alpine` runtime, exposes 8080, runs `app.jar`.
- **`frontend/Dockerfile`** — multi-stage (deps → builder → runner) on `node:20-alpine`, runs `next start`, exposes 3000.

## Build Tooling & Configuration

### Frontend config files
- `frontend/package.json`, `frontend/package-lock.json` (lockfile present).
- `frontend/tsconfig.json`, `frontend/next.config.js`, `frontend/tailwind.config.js`, `frontend/postcss.config.js`.
- `frontend/.env.local.example` (3 vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_CLOUDINARY_NAME`).

### Backend config
- `backend/pom.xml`, `backend/src/main/resources/application.properties`.

### Root
- `docker-compose.yml`, `.gitignore`, `README.md`, `TODO.md`, `copy_images.bat`, `start-backend.bat`.

### Key Configuration (defaults from `application.properties`)
| Property | Default | Notes |
|----------|---------|-------|
| `server.port` | `8080` | |
| `app.free-shipping-threshold` | `499` | business rule |
| `app.cod-max-amount` | `2000` | COD ceiling |
| `app.payment-timeout-minutes` | `15` | |
| `jwt.expiration` | `86400000` (24h) | access token |
| `jwt.refresh-expiration` | `604800000` (7d) | refresh token |
| `spring.servlet.multipart.max-file-size` | `10MB` | image upload limit |
| `springdoc.swagger-ui.path` | `/swagger-ui.html` | API docs |
| `app.name` | `1824 Vituraya Ventures Private Limited` | legal entity |

### .gitignore highlights (`/.gitignore`)
Frontend: `node_modules/`, `.next/`, `.env*.local`. Backend: `target/`, `*.class`. Env: `.env`. IDE: `.idea/`, `.vscode/`, `*.iml`.
