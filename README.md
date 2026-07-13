# 👑 The Royal Mukhwas — Full-Stack E-Commerce

**Khane Ki Happy Ending** — A premium mukhwas, mouth freshener & digestive products e-commerce platform.

A brand by Vithoba Ventures Group of Companies.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + TypeScript |
| Backend | Spring Boot 3.2 (Java 17) |
| Database | PostgreSQL 15 |
| Auth | Spring Security + JWT |
| Payments | Razorpay |
| Image Storage | Cloudinary |
| Email | JavaMailSender (SMTP) |

---

## 📁 Project Structure

```
royal-mukhwas/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # Reusable UI components
│   │   ├── lib/         # API client
│   │   ├── store/       # Zustand state (cart, auth)
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── backend/           # Spring Boot application
│   ├── src/main/java/com/royalmukhwas/
│   │   ├── controller/  # REST controllers
│   │   ├── service/      # Business logic
│   │   ├── repository/   # JPA repositories
│   │   ├── entity/        # Database entities
│   │   ├── security/      # JWT & auth config
│   │   └── dto/             # Request/response objects
│   └── pom.xml
│
├── database/
│   └── schema_and_seed.sql  # Full DB schema + sample data
│
└── docker-compose.yml  # One-command local setup
```

---

## 🚀 Quick Start (Docker — Recommended)

```bash
# 1. Clone/extract the project
cd royal-mukhwas

# 2. Start everything (Postgres + Backend + Frontend)
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Swagger:  http://localhost:8080/swagger-ui.html
```

---

## 🛠️ Manual Setup

### 1. Database

```bash
# Create PostgreSQL database
createdb royalmukhwas

# Run schema + seed
psql -d royalmukhwas -f database/schema_and_seed.sql
```

### 2. Backend (Spring Boot)

```bash
cd backend

# Set environment variables (or edit application.properties directly)
export DB_HOST=localhost
export DB_NAME=royalmukhwas
export DB_USER=postgres
export DB_PASSWORD=yourpassword
export JWT_SECRET=your-secret-key-min-32-chars
export CLOUDINARY_CLOUD_NAME=your-cloud-name
export CLOUDINARY_API_KEY=your-api-key
export CLOUDINARY_API_SECRET=your-api-secret
export RAZORPAY_KEY_ID=your-razorpay-key
export RAZORPAY_KEY_SECRET=your-razorpay-secret
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-gmail-app-password

# Run
mvn spring-boot:run
```

Backend will start on **http://localhost:8080**

### 3. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your API URL & Razorpay key

# Run dev server
npm run dev
```

Frontend will start on **http://localhost:3000**

---

## 🔑 Default Admin Login

After running the seed SQL, you need to generate a real bcrypt hash for the admin password
(the seed file has a placeholder). You can do this two ways:

**Option A — Use the register endpoint then promote manually:**
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@royalmukhwas.com';
```

**Option B — Generate a bcrypt hash:**
```bash
# Using an online bcrypt generator or this Java snippet:
# new BCryptPasswordEncoder().encode("Admin@123")
```
Then update the seed SQL `password_hash` column with the generated hash before running it.

Admin Login: `POST /api/auth/admin/login`
```json
{ "email": "admin@royalmukhwas.com", "password": "Admin@123" }
```

---

## 🔐 Environment Variables Reference

### Backend (`application.properties` / env vars)
| Variable | Description |
|---|---|
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET` | JWT signing key (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Image uploads |
| `RAZORPAY_KEY_ID/KEY_SECRET` | Payment gateway |
| `MAIL_USERNAME/MAIL_PASSWORD` | SMTP (use Gmail App Password) |
| `CORS_ORIGINS` | Allowed frontend origin(s) |

### Frontend (`.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | Cloudinary cloud name |

---

## 📦 Deployment

- **Frontend** → Vercel (recommended for Next.js)
- **Backend** → Railway / Render
- **Database** → Supabase / Neon (managed PostgreSQL)

Remember to update `CORS_ORIGINS` (backend) and `NEXT_PUBLIC_API_URL` (frontend)
to point to your production URLs.

---

## ✅ What's Implemented

- Full database schema (12 tables) with relationships
- JWT-based auth (customer / wholesale / admin roles)
- Product catalog with categories, variants (weight options), images
- Cart (client-side, Zustand) with coupon support
- Checkout flow with Razorpay integration + COD
- Order placement, tracking, status lifecycle
- Wholesale registration with admin approval flow
- Admin dashboard with stats, recent orders
- Responsive royal-themed UI (Navy/Cream/Gold) across all pages
- WhatsApp quick-order integration
- Email notifications (order confirmation, wholesale approval, welcome)

## 🔧 What You'll Want to Extend

- Complete remaining admin CRUD pages (products, categories, coupons, banners — controllers exist, UI pages are stubbed via nav)
- Seed the full 42+ product catalog (sample pattern provided in `schema_and_seed.sql`)
- OTP verification flow for registration (currently auto-verified for simplicity)
- Cart persistence to backend (currently client-side only via Zustand + localStorage)
- CSV export for sales reports
- Bilingual (EN/MR) content population

---

**A brand by Vithoba Ventures Group of Companies**
📞 9096999914 / 9370118012 | 📸 @the_royal_mukhwas
