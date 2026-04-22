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

## Phase 2 — Feed + Listings *(scaffold complete, UI pending)*

### Backend
- [x] `PostEntity` with media URLs, likes count
- [x] `GET /feed` — paginated feed
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
- [x] Feed page shell
- [x] Marketplace page shell with filter tabs
- [ ] Feed — fetch and render posts from API with infinite scroll
- [ ] Feed — create post form (text + media upload)
- [ ] Feed — like button with count
- [ ] Feed — comment thread
- [ ] Marketplace — listing card component
- [ ] Marketplace — listing detail page (`/marketplace/[id]`)
- [ ] Create listing form (`/marketplace/new`)
- [ ] Featured listing badge + boost CTA

---

## Phase 3 — Search + Events + Subscriptions *(scaffold complete, UI pending)*

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

- [x] Docker Compose with PostgreSQL service
- [x] Dockerfiles for API and Web
- [x] Swagger docs at `/api/docs`
- [x] Global rate limiting (ThrottlerModule)
- [x] CORS configured for frontend origin
- [x] `.env.example` for both apps
- [x] Firebase Admin SDK initialization via FirebaseModule (warns if env vars missing, does not crash)
- [x] Health endpoint `GET /api/v1/health` — required by Docker health checks
- [x] Global exception filter — consistent `{ statusCode, message, path, timestamp }` error shape
- [x] Environment validation on startup (DATABASE_URL + JWT_SECRET required; others optional with defaults)
- [x] Prettier config (`.prettierrc`) + ESLint configs for API and web
- [x] Typed request DTOs on all controllers (no more `any`)
- [ ] AWS S3 upload service (shared upload helper in `apps/api/src/common/`)
- [ ] Database migration files (replace `synchronize: true` before production)
- [ ] Jest unit tests for Auth and Profiles services
- [ ] E2E tests for critical auth + listing flows
- [ ] CI pipeline (GitHub Actions: lint → test → build)
- [ ] Vercel deployment config for `apps/web`
- [ ] AWS deployment config for `apps/api`

---

## Known Gaps / Decisions Needed

- **Feed scope:** `GET /feed` currently returns all posts. Needs to be scoped to users the caller follows. Requires a join on the follow graph.
- **Firebase Admin init:** ✅ Resolved — FirebaseModule initializes on startup, warns gracefully if env vars missing.
- **S3 uploads:** No upload service exists yet. Both posts and listings reference `mediaUrls[]` which must be S3 URLs. Need a signed URL or direct upload flow.
- **Listing limits:** The subscription tier limits (`SUBSCRIPTION_LIMITS` in shared types) are defined but not yet enforced in `ListingsService.create()`.
- **Comments:** `commentsCount` column exists on `PostEntity` but there is no `CommentEntity` or comments endpoints yet.
