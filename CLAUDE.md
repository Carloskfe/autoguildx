# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

AutoGuildX — professional network + marketplace for automotive experts. npm workspace monorepo:

- `apps/web` — Next.js 14 (App Router, Tailwind, dark theme), port 3000
- `apps/api` — NestJS + TypeORM + PostgreSQL, port 3001
- `packages/shared` — TypeScript domain types imported by both apps

See [`docs/PRD.md`](docs/PRD.md) for product requirements, feature scope, and business rules.
See [`docs/TASKS.md`](docs/TASKS.md) for what is built, what is pending, and known gaps.

---

## Commands

### Monorepo root
```bash
npm install          # install all workspaces
npm run dev          # web + api concurrently
npm run build        # build shared → api → web in order
```

### API (`apps/api`)
```bash
npm run dev --workspace=apps/api          # NestJS watch mode
npm run test --workspace=apps/api         # Jest unit tests
npm run test:e2e --workspace=apps/api     # E2E tests
# Run a single test file:
npx jest --testPathPattern=auth.service.spec --workspace=apps/api

npm run typeorm -- migration:generate src/migrations/Name
npm run typeorm -- migration:run
```

### Web (`apps/web`)
```bash
npm run dev --workspace=apps/web          # Next.js dev server
npm run lint --workspace=apps/web         # ESLint via next lint
npm run build --workspace=apps/web        # Production build
```

### Infrastructure
```bash
docker-compose up -d postgres             # PostgreSQL only (local dev)
docker-compose up --build                 # Full stack
```

Swagger UI: `http://localhost:3001/api/docs`

---

## API Architecture

Every domain feature follows the same NestJS pattern: `module → controller → service → entity`. All modules register in `apps/api/src/app.module.ts`.

| Module | Path | Key responsibility |
|---|---|---|
| Auth | `src/auth/` | Signup/login, Firebase token exchange, JWT issuance |
| Profiles | `src/profiles/` | Profile CRUD, follow/unfollow graph |
| Posts | `src/posts/` | Feed posts, likes |
| Listings | `src/listings/` | Marketplace CRUD, featured boost |
| Events | `src/events/` | Event CRUD, RSVP |
| Subscriptions | `src/subscriptions/` | Tier management (Free/Owner/Company) |
| Search | `src/search/` | Cross-entity ILike search |

**Auth flow:** `JwtStrategy` (`src/auth/jwt.strategy.ts`) validates Bearer tokens and injects `{ id, email, role }` into `req.user`. Protected routes use `JwtAuthGuard` (`src/common/guards/`). Use `@CurrentUser()` (`src/common/decorators/`) to extract the user in controllers.

**Firebase social login:** Frontend acquires a Firebase ID token → sends it to `POST /auth/firebase` → `firebase-admin` verifies it → API issues its own JWT. `firebase-admin` must be initialized at startup before this endpoint works (see `TASKS.md` — Known Gaps).

**Database:** `synchronize: true` in dev (schema auto-updates from entities). Always switch to explicit migrations before production (`NODE_ENV=production` disables sync).

---

## Frontend Architecture

All authenticated pages wrap their content with `AppShell` (`src/components/layout/AppShell.tsx`), which renders the sticky header, desktop sidebar nav, and mobile bottom nav.

| Route | File |
|---|---|
| `/` | `app/page.tsx` — public landing |
| `/login` | `app/login/page.tsx` |
| `/signup` | `app/signup/page.tsx` |
| `/onboarding` | `app/onboarding/page.tsx` — 2-step profile creation |
| `/feed` | `app/feed/page.tsx` |
| `/discover` | `app/discover/page.tsx` |
| `/marketplace` | `app/marketplace/page.tsx` |
| `/events` | `app/events/page.tsx` |
| `/profile` | `app/profile/page.tsx` |

**API client:** `src/lib/api.ts` — Axios instance that auto-attaches JWT from `localStorage` and redirects to `/login` on 401.

**Auth state:** Zustand store in `src/hooks/useAuth.ts`, persisted to `localStorage`. Shape: `{ token, userId, isAuthenticated }`.

**Styling:** Custom Tailwind tokens in `tailwind.config.ts` — `brand-*` (orange accent) and `surface-*` (dark backgrounds). Reusable component classes (`btn-primary`, `btn-secondary`, `card`, `input`) declared in `globals.css` under `@layer components`. Always use these instead of raw utility strings for interactive elements.

---

## Shared Types

All domain interfaces live in `packages/shared/src/types/`. Import as `@autoguildx/shared` from either app. The path alias in each `tsconfig.json` points directly to `packages/shared/src`, so no build step is needed during development.

Subscription tier limits and prices are constants exported from `packages/shared/src/types/subscription.ts` (`SUBSCRIPTION_LIMITS`, `SUBSCRIPTION_PRICES`). Use these constants in service-layer enforcement — do not hardcode numbers elsewhere.
