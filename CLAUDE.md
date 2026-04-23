# AutoGuildX — Developer Guide

AutoGuildX is a professional network + marketplace for automotive experts. For full product context see [`docs/PRD.md`](docs/PRD.md). For task status see [`docs/TASKS.md`](docs/TASKS.md).

---

## Table of Contents

1. [Git Workflow](#git-workflow)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Commands](#commands)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Shared Types](#shared-types)

---

## Git Workflow

**Always commit and push after completing any meaningful unit of work.** Progress must never sit uncommitted.

A Stop hook in `.claude/settings.json` enforces this: if uncommitted changes exist when a session ends, Claude is re-engaged to commit before stopping.

**Commit message format:**
```
<type>: <short description>

Types: feat | fix | chore | docs | ci | refactor
```

Always include the co-author trailer on every commit:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Never batch multiple unrelated changes into a single commit. Small, focused commits make it easy to track progress and revert if needed.

**Push after every commit:**
```bash
git add <specific files>
git commit -m "<type>: <description>"
git push
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| `apps/web` | Next.js 14, React, Tailwind CSS | Web frontend — dark theme, App Router |
| `apps/api` | NestJS, TypeORM | REST API, business logic, Swagger docs |
| `packages/shared` | TypeScript | Domain interfaces and constants shared by both apps |
| Database | PostgreSQL 16 | All domain data |
| Auth | JWT + Firebase Admin | Email/password login + Google OAuth |
| State | Zustand (web) | Auth store persisted to `localStorage` |
| Data fetching | TanStack React Query | Server state, caching, optimistic updates |
| Containerization | Docker + Docker Compose | Dev (DB only) and full production stack |
| CI | GitHub Actions | Lint → test → build on every push/PR to `main` |

---

## Project Structure

```
AutoGuildX/
├── docker-compose.yml          # Full production stack (web + api + postgres)
├── docker-compose.dev.yml      # Local dev — PostgreSQL + pgAdmin only
├── package.json                # npm workspace root
├── package-lock.json
├── .prettierrc                 # Shared Prettier config (singleQuote: true)
├── docs/
│   ├── PRD.md                  # Product requirements, feature scope, roadmap
│   └── TASKS.md                # Sprint tasks, completion status, known gaps
├── packages/
│   └── shared/                 # @autoguildx/shared — TypeScript domain types
│       └── src/types/
│           ├── user.ts
│           ├── profile.ts
│           ├── post.ts
│           ├── listing.ts
│           ├── event.ts
│           └── subscription.ts
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/           # Signup, login, Firebase token exchange, JWT
│   │   │   ├── profiles/       # Profile CRUD, follow/unfollow graph
│   │   │   ├── posts/          # Feed posts, likes
│   │   │   ├── listings/       # Marketplace CRUD, featured boost
│   │   │   ├── events/         # Event CRUD, RSVP
│   │   │   ├── subscriptions/  # Tier management (Free/Owner/Company)
│   │   │   ├── search/         # Cross-entity ILike search
│   │   │   ├── firebase/       # Firebase Admin SDK module
│   │   │   ├── common/         # Guards, decorators, filters, pipes
│   │   │   └── config/         # Env validation on startup (Joi)
│   │   ├── jest.config.js
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── page.tsx            # / — public landing
│       │   │   ├── login/              # /login
│       │   │   ├── signup/             # /signup
│       │   │   ├── onboarding/         # /onboarding — 2-step profile creation
│       │   │   ├── feed/               # /feed — social feed ✓ wired
│       │   │   ├── discover/           # /discover — search (shell)
│       │   │   ├── marketplace/        # /marketplace (shell)
│       │   │   ├── events/             # /events (shell)
│       │   │   └── profile/            # /profile (shell)
│       │   ├── components/
│       │   │   └── layout/
│       │   │       └── AppShell.tsx    # Sticky header + sidebar + mobile nav
│       │   ├── hooks/
│       │   │   └── useAuth.ts          # Zustand auth store, persisted to localStorage
│       │   └── lib/
│       │       ├── api.ts              # Axios — auto JWT attach, 401 redirect
│       │       └── firebase.ts         # Lazy Firebase init (SSR-safe)
│       ├── .eslintrc.js
│       ├── .prettierrc
│       ├── Dockerfile
│       └── package.json
└── .github/
    └── workflows/
        └── ci.yml
```

---

## Commands

### Monorepo root
```bash
npm install          # install all workspaces
npm run dev          # start web + api concurrently (hot reload)
npm run build        # build shared → web → api in order
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
npm run build --workspace=apps/web        # Production build (includes lint + type check)
```

### Infrastructure
```bash
# Local development — starts PostgreSQL + pgAdmin only; apps run via npm run dev
docker compose -f docker-compose.dev.yml up -d

# pgAdmin UI at http://localhost:5050  (admin@autoguildx.dev / admin)

# Full production stack — builds all images from monorepo root
docker compose up --build

# Rebuild a single service
docker compose build api
docker compose build web
```

> All Docker builds use `.` (monorepo root) as context so `packages/shared` is accessible during build. Never change the build context to an app subdirectory.
>
> `NEXT_PUBLIC_API_URL` must be passed as a build arg (see `docker-compose.yml`); it is baked into the Next.js bundle at build time and cannot be overridden at runtime.
>
> Local full-stack ports (to avoid conflicts): **Web → 3003**, **API → 3002**. Dev ports when running `npm run dev`: **Web → 3000**, **API → 3001**.

**Swagger UI (dev):** `http://localhost:3001/api/docs`
**Swagger UI (Docker):** `http://localhost:3002/api/docs`

### CI (GitHub Actions — `.github/workflows/ci.yml`)

Runs on every push and PR to `main`. Two jobs:

| Job | Steps |
|---|---|
| **quality** | install → build shared → lint API → lint web → test API |
| **build** | install → build shared → build API → build web (runs after quality) |

`node_modules` is cached via `actions/setup-node`. Concurrent runs on the same ref are cancelled automatically. Tests use `--passWithNoTests` so the job passes until test files exist.

---

## Keeping This File Current

**Update `CLAUDE.md` whenever something project-relevant becomes settled:** new architectural decisions, new modules, conventions adopted, constraints discovered, tools added, or workflow rules established. Also keep `docs/TASKS.md` in sync as tasks are completed or new ones are identified.

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

**Firebase social login:** Frontend acquires a Firebase ID token → sends it to `POST /auth/firebase` → `firebase-admin` verifies it → API issues its own JWT. `FirebaseModule` initializes the SDK on startup using `FIREBASE_*` env vars; it warns but does not crash if absent (safe for local dev without Firebase credentials).

**Database:** `synchronize: true` in dev (schema auto-updates from entities). Always switch to explicit migrations before production (`NODE_ENV=production` disables sync).

---

## Frontend Architecture

All authenticated pages wrap their content with `AppShell` (`src/components/layout/AppShell.tsx`), which renders the sticky header, desktop sidebar nav, and mobile bottom nav.

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Public landing |
| `/login` | `app/login/page.tsx` | Email + Google OAuth |
| `/signup` | `app/signup/page.tsx` | Email + Google OAuth, role selection |
| `/onboarding` | `app/onboarding/page.tsx` | 2-step profile creation |
| `/feed` | `app/feed/page.tsx` | ✓ Wired — create, like, delete, infinite scroll |
| `/discover` | `app/discover/page.tsx` | Shell only |
| `/marketplace` | `app/marketplace/page.tsx` | Shell only |
| `/events` | `app/events/page.tsx` | Shell only |
| `/profile` | `app/profile/page.tsx` | Shell only |

**Page pattern for authenticated routes:** check `useAuth().isAuthenticated` in `useEffect`, redirect to `/login` if false, disable React Query fetches with `enabled: isAuthenticated`.

**API client:** `src/lib/api.ts` — Axios instance that auto-attaches JWT from `localStorage` and redirects to `/login` on 401.

**Auth state:** Zustand store in `src/hooks/useAuth.ts`, persisted to `localStorage`. Shape: `{ token, userId, isAuthenticated }`.

**Firebase:** `src/lib/firebase.ts` — lazy init (`getFirebaseApp()` / `getFirebaseAuth()` helpers) so Firebase never runs during Next.js SSR prerendering.

**Styling:** Custom Tailwind tokens in `tailwind.config.ts` — `brand-*` (orange accent) and `surface-*` (dark backgrounds). Reusable component classes (`btn-primary`, `btn-secondary`, `card`, `input`) declared in `globals.css` under `@layer components`. Always use these instead of raw utility strings for interactive elements.

---

## Shared Types

All domain interfaces live in `packages/shared/src/types/`. Import as `@autoguildx/shared` from either app. The path alias in each `tsconfig.json` points directly to `packages/shared/src`, so no build step is needed during development.

Subscription tier limits and prices are constants exported from `packages/shared/src/types/subscription.ts` (`SUBSCRIPTION_LIMITS`, `SUBSCRIPTION_PRICES`). Use these constants in service-layer enforcement — do not hardcode numbers elsewhere.
