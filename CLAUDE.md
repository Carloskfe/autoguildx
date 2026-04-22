# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AutoGuildX is a professional network + marketplace for specialized automotive experts (mechanics, manufacturers, collectors). It is a **npm workspace monorepo** with three packages:

- `apps/web` — Next.js 14 frontend (App Router, Tailwind CSS, dark theme)
- `apps/api` — NestJS backend (TypeORM + PostgreSQL, JWT + Firebase Auth)
- `packages/shared` — TypeScript domain types shared between both apps

## Commands

### Root (monorepo)
```bash
npm install                  # Install all workspace dependencies
npm run dev                  # Run web + api concurrently
npm run build                # Build all packages in dependency order
```

### API (`apps/api`)
```bash
npm run dev --workspace=apps/api     # NestJS watch mode (port 3001)
npm run build --workspace=apps/api   # Compile to dist/
npm run test --workspace=apps/api    # Jest unit tests
npm run test:e2e --workspace=apps/api
npm run typeorm -- migration:generate src/migrations/Name  # Generate migration
npm run typeorm -- migration:run                           # Run migrations
```

### Web (`apps/web`)
```bash
npm run dev --workspace=apps/web     # Next.js dev server (port 3000)
npm run build --workspace=apps/web   # Production build
npm run lint --workspace=apps/web    # ESLint via next lint
```

### Infrastructure
```bash
docker-compose up -d postgres        # Start only PostgreSQL locally
docker-compose up --build            # Full stack (postgres + api + web)
```

Swagger docs are available at `http://localhost:3001/api/docs` when the API is running.

## Architecture

### API Module Structure

Each domain feature follows NestJS module conventions: `module → controller → service → entity`. All modules are registered in `apps/api/src/app.module.ts`.

| Module | Path | Responsibility |
|---|---|---|
| Auth | `src/auth/` | Email/password signup+login, Firebase token exchange, JWT issuance |
| Profiles | `src/profiles/` | User profiles, follow/unfollow graph |
| Posts | `src/posts/` | Social feed posts, likes |
| Listings | `src/listings/` | Marketplace parts/services, featured boost |
| Events | `src/events/` | Event creation, RSVP |
| Subscriptions | `src/subscriptions/` | Free/Owner/Company tier management |
| Search | `src/search/` | Cross-entity full-text search (profiles, listings, events) |

**Auth flow:** The `JwtStrategy` (`src/auth/jwt.strategy.ts`) validates Bearer tokens and injects `{ id, email, role }` into the request. Protected routes use `JwtAuthGuard` from `src/common/guards/`. The `@CurrentUser()` decorator (`src/common/decorators/`) extracts the injected user.

**Firebase auth:** Social login (Google) is handled on the frontend via Firebase SDK, then the ID token is sent to `POST /auth/firebase` which verifies it with `firebase-admin` and returns our own JWT.

**Database:** TypeORM with `synchronize: true` in dev (auto-migrates schema). Set `NODE_ENV=production` to disable and use explicit migrations instead.

### Frontend Structure

Next.js App Router. All authenticated pages use `AppShell` (`src/components/layout/AppShell.tsx`) which provides the sticky header, desktop sidebar nav, and mobile bottom nav.

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Public landing page |
| `/login` | `app/login/page.tsx` | Email + Google OAuth |
| `/signup` | `app/signup/page.tsx` | Email + Google, role selection |
| `/onboarding` | `app/onboarding/page.tsx` | 2-step profile creation after signup |
| `/feed` | `app/feed/page.tsx` | Social feed |
| `/discover` | `app/discover/page.tsx` | Search/directory |
| `/marketplace` | `app/marketplace/page.tsx` | Listings browse |
| `/events` | `app/events/page.tsx` | Events browse |
| `/profile` | `app/profile/page.tsx` | Own profile |

**API client:** `src/lib/api.ts` is an Axios instance that auto-attaches the JWT from `localStorage` and redirects to `/login` on 401.

**Auth state:** Managed by Zustand (`src/hooks/useAuth.ts`) with persistence. The store holds `{ token, userId, isAuthenticated }`.

**Styling conventions:** Tailwind dark theme. Custom colors defined in `tailwind.config.ts`: `brand-*` (orange accent), `surface-*` (dark backgrounds). Reusable utility classes (`btn-primary`, `btn-secondary`, `card`, `input`) are defined as `@layer components` in `globals.css`.

### Shared Types (`packages/shared`)

All domain interfaces (`User`, `Profile`, `Post`, `Listing`, `Event`, `Subscription`) live in `packages/shared/src/types/`. Both apps import from `@autoguildx/shared`. The TypeScript path alias `@autoguildx/shared` is configured in each `tsconfig.json` to point directly to `packages/shared/src` (no build step needed in dev).

### Subscription Tiers

Business logic constants are defined in `packages/shared/src/types/subscription.ts`:
- **Free:** 5 listings, $0
- **Owner:** 15 listings, 1 featured campaign, $9.99/month
- **Company:** unlimited listings, 5 featured campaigns, $99.99/month
- Featured listing boost: $5–$20, implemented via `POST /listings/:id/feature`

Payment processing is **not** in scope for MVP — subscription upgrades are recorded in DB but no payment gateway is wired.
