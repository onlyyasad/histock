# HiStock

Sales management dashboard for micro sellers who run their business through social media (Facebook, Instagram, WhatsApp). HiStock is the organized back-office *behind* their social presence — not a storefront.

Built Bangladesh-first (COD-heavy workflows, local couriers, bKash/Nagad payment methods), globally functional.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)

---

## What it does

Micro sellers take orders via social media DMs and manually track everything in spreadsheets or their heads. HiStock replaces that chaos with:

- **Order lifecycle tracking** — 8-state machine from `pending` to `delivered` / `refunded`, with COD-specific flows (delivery failure, re-attempt, remittance reconciliation)
- **Inventory management** — products, variants (size/color/etc.), stock levels, low-stock alerts
- **Customer CRM** — address book, lifetime value, order history, flagging
- **PDF invoices & packing slips** — client-side generation (no backend cost), Bangla locale support via `window.print()`
- **Profit & loss analytics** — revenue, COGS, net profit, COD remittance reconciliation
- **Multi-user access** — Owner / Manager / Staff roles with configurable permissions
- **AI features** — product description and social post generation via Groq (Llama-3), with graceful degradation
- **Mobile-first** — swipeable order cards, bottom navigation, PWA-installable, offline fallback

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Sellers frontend | Next.js 15, TypeScript, Redux Toolkit + RTK Query, TailwindCSS, ShadCN UI |
| Admin frontend | React (Vite), TanStack Router, TypeScript, TailwindCSS, ShadCN UI |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / queue | Redis 7 + BullMQ |
| Auth | express-session + passport + connect-pg-simple |
| Validation | Zod (shared schemas across all apps) |
| AI | Groq free tier (Llama-3 70B) |
| Email | Resend |
| Payments (demo) | Stripe (portfolio demo only — not available for BD merchants) |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Jest + Supertest (backend), Vitest + React Testing Library (frontend), Playwright (E2E) |

---

## Monorepo structure

```
histock/
├── apps/
│   ├── sellers/        # Next.js — seller-facing dashboard + public landing page
│   ├── admin/          # React (Vite) + TanStack Router — platform admin panel
│   └── backend/        # Express API — serves both frontends
├── packages/
│   └── shared/         # TypeScript types + Zod schemas (single source of truth)
├── docker-compose.yml  # Local dev: PostgreSQL + Redis
└── turbo.json
```

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (for local Postgres + Redis)

### 1. Clone and install

```bash
git clone https://github.com/onlyyasad/histock.git
cd histock
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
# PostgreSQL on :5433, Redis on :6379
```

### 3. Configure environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
```

Minimum required variables:

```env
DATABASE_URL=postgresql://histock:localpassword@localhost:5433/histock_dev
SESSION_SECRET=change-this-in-production
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Optional — AI features (Groq free tier)
GROQ_API_KEY=

# Optional — Email notifications
RESEND_API_KEY=
RESEND_FROM_ADDRESS=noreply@histock.app

# Optional — Stripe demo (portfolio only)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### 4. Run migrations and seed

```bash
cd apps/backend
npx prisma migrate dev
npx prisma db seed
```

### 5. Start everything

```bash
# From repo root — starts all apps in parallel
pnpm dev
```

| App | URL |
|-----|-----|
| Sellers dashboard | http://localhost:3000 |
| Admin panel | http://localhost:3001 |
| Backend API | http://localhost:4000 |

### Demo accounts

All accounts are writable and reset nightly at 18:00 UTC.

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@demo.histock.app | demo1234 |
| Manager | manager@demo.histock.app | demo1234 |
| Staff | staff@demo.histock.app | demo1234 |
| Platform Admin | admin@histock.app | admin1234 |

---

## Architecture highlights

### Multi-tenancy

All seller data is scoped to a `business_id`. A Prisma Client Extension (`$extends`) auto-injects `business_id` and `deleted_at IS NULL` on every query — no route-level leakage possible.

Two client instances with strict separation:
- `prismaWithScope(businessId)` — used in all seller routes
- `prismaAdmin` — raw client, only in admin routes (ESLint-enforced)

### Order state machine

Orders follow an 8-state machine. All transitions go through `OrderStateService` — no direct status updates in route handlers (CI-enforced via ESLint `no-restricted-syntax`).

```
pending → processing → packed → handover_to_courier → delivered
                                handover_to_courier → delivery_failed → handover_to_courier
                                                                      → cancelled
any non-terminal → cancelled
cancelled (prepaid) → refunded
delivered → refunded
```

`delivery_failed` is a first-class state, not an edge case — Bangladesh COD return rates are high.

### Monetary values

All amounts stored as `NUMERIC(12,2)` (e.g., `1234.50`). No floats, no subunit conversion, no `_paisa` column names.

### Subscription tiers

| Tier | Users | Orders/month | Products | Price |
|------|-------|-------------|----------|-------|
| Starter | 1 | 200 | 5 | Free |
| Growth | 3 | 500 | 20 | ~৳500/mo |
| Business | 10 | 1,500 | 50 | ~৳1,200/mo |
| Enterprise | Custom | Custom | Custom | Contact |

14-day free trial on Growth. Tier limits are DB-driven — no hardcoded constants.

---

## Development

```bash
pnpm dev          # start all apps
pnpm build        # build all apps
pnpm lint         # lint all apps
pnpm typecheck    # tsc --noEmit across all apps
pnpm test         # run all test suites
```

### Running tests individually

```bash
# Backend
cd apps/backend && pnpm test

# Sellers frontend
cd apps/sellers && pnpm test

# Admin frontend
cd apps/admin && pnpm test

# E2E
pnpm test:e2e
```

---

## Deployment

| Service | Platform |
|---------|----------|
| Sellers + Admin | Vercel |
| Backend + DB + Redis | AWS EC2 + Docker + Nginx |

All three domains (`app.histock.app`, `admin.histock.app`, `api.histock.app`) must share the same eTLD+1 for `SameSite=Lax` session cookies to work. Never use `*.vercel.app` in production.

Redis **must** run with AOF persistence (`appendonly yes`) — BullMQ jobs are lost on restart without it.

---

## Roadmap

- [ ] Native mobile app (React Native / Expo)
- [ ] WhatsApp Business API integration for order updates
- [ ] Yearly billing cycle
- [ ] Multi-language UI (Bangla toggle complete, Arabic planned)
- [ ] Bulk order import via CSV

---

## License

MIT
