# AutoGuildX — Development Tasks

Status legend: `[x]` done · `[ ]` pending · `[-]` in progress

---

## Phase 1 — Auth + Profiles *(scaffold complete, UI pending)*

### Backend
- [x] NestJS monorepo setup with TypeORM + PostgreSQL
- [x] `UserEntity` with email/password and OAuth provider support
- [x] `POST /auth/signup` — email/password registration
- [x] `POST /auth/login` — JWT issuance
- [x] `POST /auth/firebase` — Firebase token exchange (Google OAuth)
- [x] JWT strategy + guard + `@CurrentUser()` decorator
- [x] `ProfileEntity` with tags, follow graph (ManyToMany)
- [x] `POST /profiles`, `GET /profiles/:id`, `PATCH /profiles/me`
- [x] `POST /profiles/:id/follow`, `POST /profiles/:id/unfollow`
- [x] Input validation DTOs for profile create/update (class-validator)
- [ ] Profile image upload endpoint (AWS S3 integration)

### Frontend
- [x] Login page (email + Google OAuth)
- [x] Signup page (email + Google OAuth, role selection)
- [x] 2-step onboarding page (profile creation)
- [x] Zustand auth store with persistence
- [x] Axios API client with auto-JWT attach + 401 redirect
- [ ] Profile page — display own profile data from API
- [ ] Profile page — display other users' profiles (`/profile/[id]`)
- [ ] Follow/unfollow button with optimistic UI update
- [ ] Profile image upload UI

---

## Phase 2 — Feed + Listings *(feed wired, listings shell only)*

### Backend
- [x] `PostEntity` with media URLs, likes count
- [x] `GET /feed` — paginated feed (with user relation)
- [x] `POST /posts` — create post
- [x] `POST /posts/:id/like`
- [x] `DELETE /posts/:id`
- [x] `ListingEntity` with type, category, vehicle tags, featured flag
- [x] `GET /listings` — paginated with filters (type, category, location, q)
- [x] `POST /listings` — create listing
- [x] `PATCH /listings/:id`, `DELETE /listings/:id`
- [x] `POST /listings/:id/feature` — toggle featured boost
- [ ] Listing limit enforcement based on subscription tier
- [ ] Comments entity + endpoints (`POST /posts/:id/comments`, `GET /posts/:id/comments`)
- [ ] Feed scoped to followed users (currently returns all posts)
- [ ] Media upload endpoints for posts and listings (AWS S3)

### Frontend
- [x] Feed page — create post, like (optimistic), delete own posts, infinite scroll
- [x] Marketplace page shell with filter tabs
- [ ] Feed — comment thread
- [ ] Feed — media upload in create post form
- [ ] Marketplace — listing card component
- [ ] Marketplace — listing detail page (`/marketplace/[id]`)
- [ ] Create listing form (`/marketplace/new`)
- [ ] Featured listing badge + boost CTA

---

## Phase 3 — Search + Events + Subscriptions *(scaffold complete, UI shells only)*

### Backend
- [x] `GET /search?q=&type=` — cross-entity full-text search
- [x] `EventEntity` with RSVP count
- [x] `GET /events`, `POST /events`, `POST /events/:id/rsvp`, `DELETE /events/:id`
- [x] `SubscriptionEntity` with tier and active state
- [x] `GET /subscriptions/me`, `POST /subscriptions/upgrade`, `POST /subscriptions/cancel`
- [ ] Search: filter by location, vehicle type (extend query params)
- [ ] Enforce featured campaign limits per subscription tier

### Frontend
- [x] Discover page shell (search input)
- [x] Events page shell
- [x] Profile page shell
- [ ] Discover — wire search input to `GET /search`, render results by type
- [ ] Events — list upcoming events from API
- [ ] Event detail page (`/events/[id]`) with RSVP button
- [ ] Create event form (`/events/new`)
- [ ] Subscription upgrade page/modal (show tiers, trigger upgrade)
- [ ] AppShell — show subscription badge on profile nav item

---

## Infrastructure & Cross-Cutting

- [x] Docker Compose dev stack (PostgreSQL + pgAdmin on port 5433/5050)
- [x] Docker Compose production stack (web + api + postgres, no host port for postgres)
- [x] Dockerfiles for API and Web (multi-stage, standalone Next.js output)
- [x] `NEXT_PUBLIC_API_URL` wired as Docker build arg so it is baked at compile time
- [x] Local full-stack ports: Web → 3003, API → 3002 (avoids conflicts with other services)
- [x] Swagger docs at `/api/docs`
- [x] Global rate limiting (ThrottlerModule)
- [x] CORS configured for frontend origin
- [x] `.env.example` for both apps
- [x] Firebase Admin SDK initialization via FirebaseModule (warns if env vars missing, does not crash)
- [x] Firebase client lazy-initialized in `firebase.ts` — SSR-safe, no prerender crash
- [x] Health endpoint `GET /api/v1/health` — required by Docker health checks
- [x] Global exception filter — consistent `{ statusCode, message, path, timestamp }` error shape
- [x] Environment validation on startup (DATABASE_URL + JWT_SECRET required)
- [x] Prettier config (`.prettierrc`) in root and copied into each app dir for Docker builds
- [x] ESLint configs for API and web (including `@typescript-eslint` plugin declared in web)
- [x] Typed request DTOs on all controllers (no `any`)
- [x] Jest test runner fixed — `jest`/`ts-jest`/`@types/jest` moved to root devDependencies
- [x] `jest.config.js` added to API with ts-jest transform
- [x] CI pipeline (GitHub Actions — lint → test → build on every push/PR to `main`)
- [ ] AWS S3 upload service (shared upload helper in `apps/api/src/common/`)
- [ ] Database migration files (replace `synchronize: true` before production)
- [ ] Jest unit tests for Auth and Profiles services
- [ ] E2E tests for critical auth + listing flows
- [ ] Vercel deployment config for `apps/web`
- [ ] AWS deployment config for `apps/api`

---

## Known Gaps / Decisions Needed

- **Feed scope:** `GET /feed` currently returns all posts. Needs to be scoped to users the caller follows. Requires a join on the follow graph.
- **S3 uploads:** No upload service exists yet. Both posts and listings reference `mediaUrls[]` which must be S3 URLs. Need a signed URL or direct upload flow.
- **Listing limits:** The subscription tier limits (`SUBSCRIPTION_LIMITS` in shared types) are defined but not yet enforced in `ListingsService.create()`.
- **Comments:** `commentsCount` column exists on `PostEntity` but there is no `CommentEntity` or comments endpoints yet.
- **Payment gateway:** Subscription tiers are recorded in DB but no payment processor is wired (post-MVP per PRD).
- **Profile page:** Shows a shell only — no real data fetched from API yet.
