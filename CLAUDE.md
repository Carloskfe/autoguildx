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
8. [Testing Requirements](#testing-requirements)

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
│           ├── profile.ts      # Profile, ProfileRoleType
│           ├── post.ts         # Post, Comment
│           ├── listing.ts
│           ├── event.ts
│           └── subscription.ts # SubscriptionTier, SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICES
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/           # Signup, login, Firebase token exchange, JWT
│   │   │   ├── profiles/       # Profile CRUD, follow/unfollow graph, video avatar
│   │   │   ├── posts/          # Feed posts, reactions, sharing, visibility, link extraction
│   │   │   ├── comments/       # Threaded comments on posts
│   │   │   ├── listings/       # Marketplace CRUD, featured boost, tier enforcement
│   │   │   ├── events/         # Event CRUD, RSVP
│   │   │   ├── messages/       # 1:1 conversations, unread count
│   │   │   ├── notifications/  # In-app notifications, unread count, mark-read
│   │   │   ├── reviews/        # 5-star ratings with dimensions, upsert, summary
│   │   │   ├── subscriptions/  # Tier mgmt, Stripe Checkout session, webhook handler
│   │   │   ├── search/         # Cross-entity ILike search
│   │   │   ├── upload/         # S3 presign stub (POST /upload/presign)
│   │   │   ├── firebase/       # Firebase Admin SDK module
│   │   │   ├── common/         # Guards, decorators, filters, pipes
│   │   │   ├── config/         # Env validation on startup (Joi)
│   │   │   ├── migrations/     # TypeORM migration files (prod)
│   │   │   └── data-source.ts  # TypeORM DataSource for migration CLI
│   │   ├── tests/unit/         # Mirrors src/ — one .spec.ts per service
│   │   ├── test/               # E2E specs + jest-e2e.json
│   │   ├── jest.config.js      # isolatedModules:true, maxWorkers:2, forceExit:true
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # App Router pages (all fully wired — see Frontend Architecture)
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   └── AppShell.tsx      # Header + sidebar + mobile nav, unread badges
│       │   │   ├── NotificationPanel.tsx  # Slide-down notification dropdown
│       │   │   ├── ReviewSection.tsx      # Star picker, histogram, dimension ratings
│       │   │   └── UpgradeModal.tsx       # Tier cards + Stripe Checkout redirect
│       │   ├── hooks/
│       │   │   └── useAuth.ts            # Zustand auth store, persisted to localStorage
│       │   └── lib/
│       │       ├── api.ts                # Axios — auto JWT attach, 401 redirect
│       │       ├── firebase.ts           # Lazy Firebase init (SSR-safe)
│       │       └── upload.ts             # uploadFile(file) → presign → PUT → publicUrl
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

`node_modules` is cached via `actions/setup-node`. Concurrent runs on the same ref are cancelled automatically. Tests are required — the `--passWithNoTests` flag has been removed now that unit tests exist for all services.

---

## Testing Requirements

### Rule: Every service MUST have unit tests

For every service file created or modified, a corresponding unit test file MUST be created or updated in the same task. No service is considered "done" without its tests passing.

### File structure — Mirrored `tests/unit/` directory

All API unit tests live under `apps/api/tests/unit/` and MUST mirror the structure of `apps/api/src/` exactly.

```
apps/api/
├── src/
│   ├── auth/
│   │   └── auth.service.ts
│   ├── profiles/
│   │   └── profiles.service.ts
│   └── posts/
│       └── posts.service.ts
└── tests/
    └── unit/
        ├── auth/
        │   └── auth.service.spec.ts
        ├── profiles/
        │   └── profiles.service.spec.ts
        └── posts/
            └── posts.service.spec.ts
```

### Naming convention

- Source file:  `apps/api/src/auth/auth.service.ts`
- Test file:    `apps/api/tests/unit/auth/auth.service.spec.ts`

The rule is simple: **take the source path, replace `apps/api/src/` with `apps/api/tests/unit/`, and change the `.ts` extension to `.spec.ts`.**

### Non-negotiable behaviors

- NEVER create a service file without also creating its corresponding test file under `apps/api/tests/unit/` following the mirrored structure above.
- NEVER place test files inside `src/`, `/docs/`, or any other directory.
- Tests must cover: happy path, edge cases, and error/failure scenarios.
- Every public method in the service must have at least one test.
- Mock ALL external dependencies (TypeORM repositories, Firebase Admin, JWT service, external HTTP calls). No test should touch a real database or make a real network call. Use `@nestjs/testing` `Test.createTestingModule()` with jest mocks.
- Tests must be fully isolated — no shared state between test cases.

### jest.config.js requirement

The config at `apps/api/jest.config.js` must remain exactly as below. Do not revert these settings — they prevent OOM crashes on machines with limited RAM (ts-jest without `isolatedModules` loads the entire TypeScript type graph per worker, which exceeds available memory).

```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^@autoguildx/shared$': '<rootDir>/../../packages/shared/src',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  maxWorkers: 2,
  forceExit: true,
};
```

**Why `isolatedModules: true`:** Without it, ts-jest performs full type-checking and loads all transitive type definitions (including aws-sdk at 101 MB) — each worker hits >1.5 GB heap, crashing machines with ≤8 GB RAM when Jest runs 7 workers in parallel.

**Why `maxWorkers: 2`:** Caps parallel Jest workers so total memory stays under ~1.5 GB on an 8 GB machine.

The `test` script in `apps/api/package.json` also includes a heap cap:
```json
"test": "NODE_OPTIONS='--max-old-space-size=3072' jest"
```

### Before marking any task complete, verify

- [ ] A test file exists at the correct mirrored path under `apps/api/tests/unit/`
- [ ] The test file name follows the `.spec.ts` suffix convention
- [ ] All tests pass: `npm run test --workspace=apps/api`
- [ ] Coverage for the modified service is above 80%: `npm run test --workspace=apps/api -- --coverage`
- [ ] No test depends on a real database or external network call

---

## Keeping Docs Current

**This is a mandatory step at the end of every session and after every completed task.**

Update all three management documents whenever anything project-relevant changes:

| Document | Update when |
|---|---|
| `CLAUDE.md` | New modules added, routes change status, architectural decisions made, new conventions or constraints established, tools added |
| `docs/TASKS.md` | Tasks completed (mark `[x]`), new tasks identified, sprint closed, sprint plan written |
| `docs/PRD.md` | Features shipped (move from roadmap to built scope), non-goals resolved, risks change, new post-MVP items identified |

Never leave a session with docs that contradict the actual codebase state.

---

## API Architecture

Every domain feature follows the same NestJS pattern: `module → controller → service → entity`. All modules register in `apps/api/src/app.module.ts`.

| Module | Path | Key responsibility |
|---|---|---|
| Auth | `src/auth/` | Signup/login, Firebase token exchange, JWT issuance |
| Profiles | `src/profiles/` | Profile CRUD, follow/unfollow graph, video avatar |
| Posts | `src/posts/` | Feed posts, reactions, sharing, visibility, link extraction |
| Comments | `src/posts/` | Threaded comments on posts and forum posts (co-located with Posts module) |
| Forums | `src/forums/` | AGXTopics: forum CRUD, membership, posts, hot/top/new sort, upvote/downvote, comment voting |
| Listings | `src/listings/` | Marketplace CRUD, featured boost, tier limit enforcement |
| Events | `src/events/` | Event CRUD, RSVP |
| Messages | `src/messages/` | 1:1 conversation threads, unread count |
| Notifications | `src/notifications/` | In-app notifications, unread count, mark-read |
| Reviews | `src/reviews/` | 5-star ratings with dimensions, upsert, summary |
| Subscriptions | `src/subscriptions/` | Tier management, Stripe Checkout, webhook handler |
| Search | `src/search/` | Cross-entity ILike search |
| Upload | `src/upload/` | S3 presign stub (`POST /upload/presign`) |

**Auth flow:** `JwtStrategy` (`src/auth/jwt.strategy.ts`) validates Bearer tokens and injects `{ id, email, role }` into `req.user`. Protected routes use `JwtAuthGuard` (`src/common/guards/`). Use `@CurrentUser()` (`src/common/decorators/`) to extract the user in controllers.

**Firebase social login:** Frontend acquires a Firebase ID token → sends it to `POST /auth/firebase` → `firebase-admin` verifies it → API issues its own JWT. `FirebaseModule` initializes the SDK on startup using `FIREBASE_*` env vars; it warns but does not crash if absent (safe for local dev without Firebase credentials).

**Database:** `synchronize: true` in dev (schema auto-updates from entities). Always switch to explicit migrations before production (`NODE_ENV=production` disables sync).

---

## Frontend Architecture

All authenticated pages wrap their content with `AppShell` (`src/components/layout/AppShell.tsx`), which renders the sticky header, desktop sidebar nav, and mobile bottom nav. AppShell polls for unread message count (10 s) and unread notification count (15 s), and shows live badges on the Messages nav item and the Bell icon.

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Public landing |
| `/login` | `app/login/page.tsx` | Email + Google OAuth |
| `/signup` | `app/signup/page.tsx` | Email + Google OAuth — no role selection, goes straight to onboarding |
| `/onboarding` | `app/onboarding/page.tsx` | 3-step: role picker → profile details → specialty tags |
| `/agxtopics` | `app/agxtopics/page.tsx` | ✓ Wired — forum list, category filter, join/leave |
| `/agxtopics/new` | `app/agxtopics/new/page.tsx` | ✓ Wired — create forum with auto-slug |
| `/agxtopics/[slug]` | `app/agxtopics/[slug]/page.tsx` | ✓ Wired — forum detail, Hot/Top/New sort, upvote/downvote |
| `/agxtopics/[slug]/new` | `app/agxtopics/[slug]/new/page.tsx` | ✓ Wired — create post |
| `/agxtopics/[slug]/[postId]` | `app/agxtopics/[slug]/[postId]/page.tsx` | ✓ Wired — post detail, Reddit-style voting, threaded comments, emoji reactions |
| `/feed` | `app/feed/page.tsx` | ✓ Wired — compose, reactions, comments, share/repost, media modes, link previews, visibility picker, infinite scroll |
| `/discover` | `app/discover/page.tsx` | ✓ Wired — keyword search, section filter (All/People/Listings/Events), star ratings |
| `/marketplace` | `app/marketplace/page.tsx` | ✓ Wired — listing grid, type filter, search, star ratings, infinite scroll |
| `/marketplace/new` | `app/marketplace/new/page.tsx` | ✓ Wired — create form with images, tier limit → UpgradeModal |
| `/marketplace/[id]` | `app/marketplace/[id]/page.tsx` | ✓ Wired — detail, boost, delete, message seller, share to feed, reviews |
| `/events` | `app/events/page.tsx` | ✓ Wired — upcoming list, date blocks, type badges, infinite scroll |
| `/events/new` | `app/events/new/page.tsx` | ✓ Wired — create form |
| `/events/[id]` | `app/events/[id]/page.tsx` | ✓ Wired — detail, RSVP, delete, share to feed |
| `/messages` | `app/messages/page.tsx` | ✓ Wired — conversation list + message thread, real-time-ish via polling |
| `/notifications` | `app/notifications/page.tsx` | ✓ Wired — list with read/unread state and deep links |
| `/profile` | `app/profile/page.tsx` | ✓ Wired — own profile, avatar/video upload, inline edit, role picker, posts |
| `/profile/[id]` | `app/profile/[id]/page.tsx` | ✓ Wired — public profile, follow/unfollow, message, posts, reviews |
| `/subscription/success` | `app/subscription/success/page.tsx` | Stripe checkout success — invalidates subscription cache |
| `/subscription/cancel` | `app/subscription/cancel/page.tsx` | Stripe checkout cancel |

**Page pattern for authenticated routes:** check `useAuth().isAuthenticated` in `useEffect`, redirect to `/login` if false, disable React Query fetches with `enabled: isAuthenticated`.

**API client:** `src/lib/api.ts` — Axios instance that auto-attaches JWT from `localStorage` and redirects to `/login` on 401.

**Auth state:** Zustand store in `src/hooks/useAuth.ts`, persisted to `localStorage`. Shape: `{ token, userId, isAuthenticated }`.

**Firebase:** `src/lib/firebase.ts` — lazy init (`getFirebaseApp()` / `getFirebaseAuth()` helpers) so Firebase never runs during Next.js SSR prerendering.

**Styling:** Custom Tailwind tokens in `tailwind.config.ts` — `brand-*` (orange accent) and `surface-*` (dark backgrounds). Reusable component classes (`btn-primary`, `btn-secondary`, `card`, `input`) declared in `globals.css` under `@layer components`. Always use these instead of raw utility strings for interactive elements.

---

## Shared Types

All domain interfaces live in `packages/shared/src/types/`. Import as `@autoguildx/shared` from either app. The path alias in each `tsconfig.json` points directly to `packages/shared/src`, so no build step is needed during development.

Subscription tier limits and prices are constants exported from `packages/shared/src/types/subscription.ts` (`SUBSCRIPTION_LIMITS`, `SUBSCRIPTION_PRICES`). Use these constants in service-layer enforcement — do not hardcode numbers elsewhere.
