# AutoGuildX — Sprint Board

Status legend: `[x]` done · `[ ]` pending · `[-]` in progress

---

## Sprint 1 — Foundation ✅ COMPLETE

**Goal:** Working monorepo, full backend API, CI/CD, Docker.

- [x] NestJS + TypeORM + PostgreSQL monorepo setup
- [x] `UserEntity` — email/password + OAuth provider support
- [x] Auth module: signup, login, Firebase token exchange, JWT issuance
- [x] JWT strategy + guard + `@CurrentUser()` decorator
- [x] Profiles module: CRUD, follow/unfollow graph (ManyToMany)
- [x] Posts module: feed, create, like, delete
- [x] Listings module: CRUD, filters, featured boost
- [x] Events module: CRUD, RSVP
- [x] Subscriptions module: tier management (Free/Owner/Company)
- [x] Search module: cross-entity ILike search
- [x] Input validation DTOs on all controllers (class-validator)
- [x] Global exception filter — consistent error shape
- [x] Health endpoint `GET /api/v1/health`
- [x] Global rate limiting (ThrottlerModule)
- [x] Environment validation on startup (DATABASE_URL + JWT_SECRET required)
- [x] Swagger docs at `/api/docs`
- [x] Docker Compose dev stack (PostgreSQL + pgAdmin on 5433/5050)
- [x] Docker Compose production stack (multi-stage builds, standalone Next.js)
- [x] `NEXT_PUBLIC_API_URL` wired as Docker build arg (baked at compile time)
- [x] CI pipeline (GitHub Actions: lint → test → build on every push/PR)
- [x] Shared types in `packages/shared` (`@autoguildx/shared`)
- [x] Prettier + ESLint configs for both apps
- [x] Jest test runner fixed — jest/ts-jest/types at root for correct hoisting

---

## Sprint 2 — Core Frontend ✅ COMPLETE

**Goal:** Every page in the nav is wired to real API data.

- [x] Login page — email + Google OAuth (Firebase)
- [x] Signup page — email + Google OAuth, role selection
- [x] 2-step onboarding — profile creation after signup
- [x] Zustand auth store with `localStorage` persistence
- [x] Axios API client — auto JWT attach, 401 redirect
- [x] Firebase client lazy-initialized (SSR-safe, no prerender crash)
- [x] `/feed` — create post, like (optimistic + rollback), delete own, infinite scroll
- [x] `/profile` — own profile display, inline edit (name/bio/location), own posts list
- [x] `/marketplace` — listing grid, type filter, search, load more (public)
- [x] `/marketplace/new` — create form (type, category, title, description, price, tags, location)
- [x] `/marketplace/[id]` — full detail, email seller, delete own listing
- [x] `/discover` — cross-entity search, section filter (All/People/Listings/Events)
- [x] `/events` — upcoming event list with date blocks and type badges (public)
- [x] `/events/new` — create form (title, type, description, location, start/end datetime)
- [x] `/events/[id]` — full detail, RSVP with optimistic count, delete own event
- [x] AppShell — sticky header, desktop sidebar, mobile bottom nav

---

## Sprint 3 — Social Graph 🔜 NEXT

**Goal:** Complete the follow graph loop and add comments so the feed becomes a real social experience.

### Backend
- [ ] `GET /feed` — scope to followed users (join on `profile_followers`)
- [ ] `CommentEntity` + `POST /posts/:id/comments` + `GET /posts/:id/comments`

### Frontend
- [ ] `/profile/[id]` — other users' profiles (name, bio, tags, follower count)
- [ ] Follow / unfollow button on other users' profiles (optimistic update)
- [ ] Comment thread on feed posts (show count, expand, add comment)
- [ ] Feed `commentsCount` badge on each post card

---

## Sprint 4 — Monetization

**Goal:** Close the subscription loop — users can see their tier, upgrade, and the limits are enforced.

### Backend
- [ ] Enforce listing limit per subscription tier in `ListingsService.create()`
- [ ] Enforce featured campaign limit per tier in `ListingsService.featureListing()`

### Frontend
- [ ] Subscription upgrade page / modal — show tiers + pricing, trigger `POST /subscriptions/upgrade`
- [ ] AppShell profile nav — show subscription tier badge (Free / Owner / Company)
- [ ] Featured listing boost CTA on `/marketplace/[id]` (own listing, non-featured)
- [ ] Graceful error when listing limit is hit — prompt to upgrade

---

## Sprint 5 — Media Uploads

**Goal:** Posts and listings can have real images; profiles have a photo.

### Backend
- [ ] AWS S3 upload service — shared signed-URL helper in `apps/api/src/common/upload/`
- [ ] `POST /upload/presign` — returns a pre-signed S3 URL for direct browser upload
- [ ] Profile image upload endpoint (`PATCH /profiles/me` accepts `profileImageUrl`)
- [ ] Accept `mediaUrls[]` on post and listing create (already in schema, just needs wiring)

### Frontend
- [ ] Profile image upload — file picker, upload to S3, save URL to profile
- [ ] Post create form — attach image via S3 pre-signed URL, preview before submit
- [ ] Listing create form — attach up to 5 images, preview carousel on detail page

---

## Sprint 6 — Quality & Production Readiness

**Goal:** Test coverage, safe database schema management, and deployable to real infrastructure.

### Test infrastructure setup
- [x] Update `apps/api/jest.config.js` — change `rootDir` from `'src'` to `'.'` and set `testMatch` to `['<rootDir>/tests/unit/**/*.spec.ts']` (required so Jest discovers the mirrored `tests/unit/` directory)
- [x] Remove `--passWithNoTests` flag from `.github/workflows/ci.yml` once the unit test suite is established

### Unit tests — all under `apps/api/tests/unit/`, mirroring `apps/api/src/`
- [x] `auth/auth.service.spec.ts` — signup, login, Firebase token exchange, JWT issuance
- [x] `profiles/profiles.service.spec.ts` — create, update, follow/unfollow graph
- [x] `posts/posts.service.spec.ts` — create, like, delete, feed pagination
- [x] `listings/listings.service.spec.ts` — create, update, delete, filter, featured boost, tier limit enforcement
- [x] `events/events.service.spec.ts` — create, update, delete, RSVP
- [x] `subscriptions/subscriptions.service.spec.ts` — tier lookup, upgrade
- [x] `search/search.service.spec.ts` — cross-entity ILike search results

### E2E tests
- [ ] Full auth flow — signup → onboarding → feed
- [ ] Listing creation and detail view

### Infrastructure
- [ ] Replace `synchronize: true` with explicit TypeORM migration files
- [ ] Vercel deployment config for `apps/web`
- [ ] AWS deployment config for `apps/api` (ECS task definition or EC2)
- [ ] Production `.env` secrets management (AWS Secrets Manager or similar)
- [ ] CORS locked down to production domain

---

## Known Gaps / Open Decisions

| Gap | Detail | Sprint |
|---|---|---|
| Feed scope | `GET /feed` returns all posts, not just followed users | S3 |
| Comments | `commentsCount` exists on `PostEntity` but no entity or endpoints | S3 |
| Listing limits | `SUBSCRIPTION_LIMITS` defined but not enforced in service | S4 |
| S3 uploads | `mediaUrls[]` fields exist but upload flow not built | S5 |
| Payment gateway | Subscription tier upgrades recorded in DB; no payment processor | Post-MVP |
| Other user profiles | `/profile/[id]` for viewing other people not built yet | S3 |
| Test coverage | ✅ 100% statement coverage on all 7 services; 70 passing unit tests under `apps/api/tests/unit/` | — |
