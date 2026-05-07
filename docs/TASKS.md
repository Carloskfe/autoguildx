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

## Sprint 3 — Social Graph ✅ COMPLETE

**Goal:** Complete the follow graph loop and add comments so the feed becomes a real social experience.

### Backend
- [x] `GET /feed` — scope to followed users (join on `profile_followers`); falls back to all posts if following nobody
- [x] `CommentEntity` + `POST /posts/:id/comments` + `GET /posts/:id/comments`
- [x] `GET /profiles/me/following` — returns profiles the current user follows
- [x] `ProfilesService.getFollowingUserIds()` — used internally for feed scoping
- [x] `OptionalJwtAuthGuard` on `GET /feed` — feed is scoped when authenticated, public otherwise
- [x] Feed response includes `user.profile` relation so frontend can link to `/profile/[id]`

### Frontend
- [x] `/profile/[id]` — other users' profiles (name, bio, tags, follower count, posts)
- [x] Follow / unfollow button on other users' profiles (invalidates following cache)
- [x] Comment thread on feed posts (expand/collapse, load comments, add comment)
- [x] Feed `commentsCount` badge on each post card
- [x] Post author names link to `/profile/[id]` on the feed

### Tests
- [x] `posts/comments.service.spec.ts` — create, findByPost, error cases (83 total tests passing)

---

## Sprint 4 — Monetization ✅ COMPLETE

**Goal:** Close the subscription loop — users can see their tier, upgrade, and the limits are enforced.

### Backend
- [x] Enforce listing limit per subscription tier in `ListingsService.create()` — throws 403 with message
- [x] Enforce featured campaign limit per tier in `ListingsService.featureListing()` — ownership check + tier check
- [x] `featureListing` now requires `userId` for ownership verification before boosting

### Frontend
- [x] `UpgradeModal` component — tier cards with pricing, features, upgrade button (`POST /subscriptions/upgrade`)
- [x] AppShell — subscription tier badge (Free / Owner / Company) in header + sidebar; click to open UpgradeModal
- [x] Featured listing boost CTA on `/marketplace/[id]` — shown for own non-featured listings; opens UpgradeModal on 403
- [x] `/marketplace/new` — 403 response from listing limit opens UpgradeModal automatically

### Tests
- [x] Updated `listings.service.spec.ts` — tier limit enforcement for create and featureListing (90 total tests passing)

---

## Sprint 5 — Media Uploads

**Goal:** Posts and listings can have real images; profiles have a photo.

### Backend
- [x] `UploadService` stub in `apps/api/src/upload/` — returns mock `uploadUrl` + `publicUrl` + `key`; swap body for real S3 SDK when credentials are ready
- [x] `POST /upload/presign` — returns a pre-signed URL for direct browser upload (stubbed)
- [x] Profile image upload endpoint (`PATCH /profiles/me` accepts `profileImageUrl`)
- [x] Accept `mediaUrls[]` on post and listing create (already in schema, just needs wiring)

### Frontend
- [x] `apps/web/src/lib/upload.ts` — shared `uploadFile(file)` helper: presign → PUT → return publicUrl
- [x] Profile image upload — camera overlay on avatar, file picker → upload → PATCH profileImageUrl
- [x] Post create form — Photo button, preview thumbnail, submit with mediaUrls
- [x] Feed post cards — render mediaUrls[0] image below content
- [x] Listing create form — up to 5 images with preview grid, submit with mediaUrls
- [x] Listing detail page — image gallery (single full-width or 2-col grid)

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
- [x] Full auth flow — signup → onboarding → feed (`apps/api/test/auth.e2e-spec.ts`)
- [x] Listing creation and detail view (`apps/api/test/listings.e2e-spec.ts`)

### Infrastructure
- [x] Replace `synchronize: true` with explicit TypeORM migration files (`src/migrations/`, `src/data-source.ts`; prod runs migrations automatically, dev keeps sync)
- [x] Vercel deployment config for `apps/web` (`apps/web/vercel.json`)
- [x] AWS deployment config for `apps/api` (`deploy/ecs-task-definition.json` — ECS Fargate task definition template)
- [x] Production `.env` secrets management (all secrets sourced from AWS Secrets Manager via ECS task definition; `.env.example` updated with `FRONTEND_URL`)
- [x] CORS locked down to production domain (controlled via `FRONTEND_URL` env var in `main.ts`; set to production domain on deploy)

---

## Resolved Gaps

All gaps identified during Sprint 1–6 have been closed. See individual sprint entries for details.

---

## Sprint 7 — Engagement & Trust ✅ COMPLETE

**Goal:** Complete the backlog items identified post-Sprint 6.

### Reactions
- [x] `PostReactionEntity` — unique per `userId + postId`; 5 types: fire🔥 love❤️ respect🔧 wild😮 like👍
- [x] `POST /posts/:id/react`, `DELETE /posts/:id/react`, `GET /posts/:id/reactions`, `GET /posts/:id/my-reaction`
- [x] Feed: hover-reveal reaction picker, top-2 emoji badge, optimistic local state toggle

### Post Visibility
- [x] `visibility` column on `PostEntity` (public / followers / private, default public)
- [x] `getFeed` filters to public posts only via QueryBuilder
- [x] Compose form: inline 3-icon visibility pill (🌐 Public / 👥 Followers / 🔒 Only me)

### Share / Repost
- [x] `sharesCount` + `sharedPostId` on `PostEntity`; `POST /posts/:id/share` (optional comment)
- [x] Feed: share button → Quick Share or Share with comment (modal with post preview)
- [x] Shared post preview card rendered inline in feed

### Reviews (5-star)
- [x] `ReviewEntity` — overall rating + 4 dimension ratings (quality / communication / timeliness / value)
- [x] Upsert review (one per reviewer–target pair); `DELETE /reviews/:id`
- [x] `GET /reviews/:targetType/:targetId` — paginated list + avg + distribution histogram
- [x] `GET /reviews/:targetType/:targetId/summary` — lightweight avg + total for cards
- [x] `ReviewSection` component — star picker, distribution histogram, dimension ratings
- [x] Wired into `/profile/[id]` (with 4 dimensions) and `/marketplace/[id]` (overall only)

### Tests
- [x] Updated `posts/posts.service.spec.ts` — 22 tests covering react/unreact/getReactions/share/visibility
- [x] `reviews/reviews.service.spec.ts` — upsert, getForTarget, getSummary, delete (141 total tests passing)

---

## Sprint 8 — Engagement Polish ✅ COMPLETE

**Goal:** Complete backlog carry-overs and close the onboarding loop.

### Quick wins
- [x] Review summary badges on discover profile/listing cards (⭐ avg + total)
- [x] Marketplace listing share to feed — "Share to Feed" modal with snapshot card on `/marketplace/[id]`
- [x] Event share to feed — "Share to Feed" modal with snapshot card on `/events/[id]`
- [x] Copy-link share button on listings, events, and profiles

### Post media & rich content
- [x] YouTube link preview — detect URL in content, store `linkUrl` + `linkPreviewType`; render thumbnail card in feed
- [x] Generic link preview card for non-YouTube URLs
- [x] Post media modes — `single` / `multi` (grid) / `carousel` (swipeable with dots); toolbar in compose form
- [x] Links in posts auto-linkified; 1-link-per-post rule enforced on compose
- [x] Shared listing/event inline preview card in feed (`sharedContentType` / `sharedContentId` / `sharedContent` snapshot)

### Profile avatar video
- [x] `profileVideoUrl` column on `ProfileEntity` (nullable)
- [x] `PATCH /profiles/me` accepts `profileVideoUrl` via DTO
- [x] `Profile` shared type updated with `profileVideoUrl?: string`
- [x] Avatar upload on `/profile` detects video vs image by MIME type; PATCHes correct field
- [x] Feed and `/profile/[id]` render `<video>` when `profileVideoUrl` is set

### Onboarding & role alignment
- [x] `/onboarding` — 3-step flow: role picker → profile details → specialty tags
- [x] `/signup` — no role selection; redirects straight to `/onboarding`
- [x] `ProfileRoleType` updated to `'mechanic' | 'manufacturer' | 'collector' | 'enthusiast'`
- [x] DTO `@IsIn` and entity default updated to match
- [x] 2×2 role picker grid added to `/profile` edit form so users can change role after onboarding

---

## Sprint 9 — Polish & Self-Service ✅ COMPLETE

**Goal:** Close the remaining UX gaps so users can fully self-manage their profiles and subscriptions, and add location/vehicle filters to Discover.

### Profile — tag editing
- [x] Add specialty tag picker to `/profile` edit form (same tag set as onboarding step 3)
- [x] `PATCH /profiles/me` already accepts `tags[]` — frontend change only

### Subscription self-service
- [x] Add cancel/downgrade option to `UpgradeModal` for users on Owner or Company tier
- [x] Wire to existing `DELETE /subscriptions/me` endpoint
- [x] Show confirmation dialog before cancelling

### Discover — advanced filters
- [x] Add location filter input to `/discover` page
- [x] Add vehicle type / tag filter chips
- [x] Pass `location` and `tag` query params to `GET /search`
- [x] Update `SearchService` to filter by location (ILike) and tags when params present
- [x] Add unit tests for new filter cases in `search/search.service.spec.ts` (211 total passing)

### Stripe activation (ops — no code changes needed)
- [ ] Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_OWNER`, `STRIPE_PRICE_COMPANY`, `STRIPE_WEBHOOK_SECRET` in production env
- [ ] Register Stripe webhook endpoint (`POST /subscriptions/webhook`) in Stripe dashboard
- [ ] Smoke-test checkout flow in Stripe test mode

### Doc & code hygiene
- [x] Update `CLAUDE.md` — route table, API modules, jest config (this session)
- [x] Update `PRD.md` — reflect built features, remove resolved non-goals (this session)
- [x] Update `TASKS.md` — Sprint 9 plan (this session)

---

## Sprint 10 — AGXTopics (Community Forums) ✅ COMPLETE

**Goal:** Reddit-style thematic forums with threaded comments, reactions, and upvote/downvote ranking.

### Backend
- [x] `CommentEntity` extended: `parentId` (self-referential), `forumPostId` (nullable), `voteScore`
- [x] `CommentReactionEntity` — unique per userId+commentId; 5 emoji types (fire/love/respect/wild/like)
- [x] `ForumEntity` — name, slug (unique), description, category, rules, memberCount, postCount
- [x] `ForumMemberEntity` — junction for forum membership (unique userId+forumId)
- [x] `ForumPostEntity` — title, content, mediaUrls, voteScore, commentCount, isPinned, isLocked
- [x] `ForumVoteEntity` — unique per userId+forumPostId; value +1/-1
- [x] `ForumCommentVoteEntity` — unique per userId+commentId; value +1/-1
- [x] `CommentsService` — threaded tree builder (`buildTree`), forum post comment creation, reactions (upsert/remove/get), `findByForumPost`
- [x] `ForumsService` — full CRUD, join/leave, post CRUD, hot/top/new sort (hot uses age-decay formula), vote upsert/remove on posts and comments
- [x] `ForumsModule` registered in `AppModule`; `CommentsService` exported from `PostsModule`
- [x] All forum REST endpoints wired (21 routes across `ForumsController` + `CommentsVoteController`)
- [x] `CreateCommentDto` extended with optional `parentId`

### Tests
- [x] `tests/unit/posts/comments.service.spec.ts` — extended with threading, forum post path, reactions (205 total passing)
- [x] `tests/unit/forums/forums.service.spec.ts` — full coverage of all ForumsService methods

### Frontend
- [x] `/agxtopics` — forum list, category filter bar, join/leave per forum
- [x] `/agxtopics/new` — create forum form with auto-slug generation
- [x] `/agxtopics/[slug]` — forum detail, Hot/Top/New sort tabs, post list with upvote/downvote arrows
- [x] `/agxtopics/[slug]/new` — create post form
- [x] `/agxtopics/[slug]/[postId]` — post detail with Reddit-style vote column, threaded comments, delete (author only)
- [x] `ForumCommentThread` component — nested replies (1-level indent), per-comment upvote/downvote, emoji reaction picker, inline reply input, locked-post guard
- [x] AGXTopics (Hash icon) added to AppShell nav

---

## Sprint 11 — Verified Badges + Real-Time Messaging ✅ COMPLETE

**Goal:** Add an identity-trust layer (verified badges) and upgrade messaging from 5s polling to WebSocket-based real-time delivery.

### Feature A — Verified Badges

#### Backend
- [x] `Profile.isVerified: boolean` added to shared type and `ProfileEntity`
- [x] `@Roles()` decorator and `RolesGuard` created in `src/common/`
- [x] `VerificationRequestEntity` — tracks userId, profileId, status (pending/approved/denied), optional note
- [x] `VerificationService` — requestVerification (ConflictException on duplicate pending), getPendingRequests, reviewRequest (approve sets isVerified + notifies), getMyRequestStatus
- [x] `VerificationController` — POST /verification/request, GET /verification/my-status, GET /verification/pending [admin], PATCH /verification/:id/review [admin]
- [x] `VerificationModule` registered in `AppModule`
- [x] Migration `1700000000006-AddVerifiedBadge.ts` — adds `isVerified` column to profiles, creates `verification_requests` table
- [x] `tests/unit/verification/verification.service.spec.ts` — 11 tests covering all methods

#### Frontend
- [x] `VerifiedBadge` component (`src/components/VerifiedBadge.tsx`) — `CheckCircle2` in brand orange, `size` sm/md prop
- [x] Badge shown next to name on: own profile page, public profile page, feed post author, discover profile cards
- [x] "Request Verification" card on own profile — shows status if pending/denied, hides if verified

### Feature B — Real-Time WebSocket Messaging

#### Backend
- [x] `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io` installed
- [x] `MessagesGateway` — JWT-authenticated WebSocket gateway on `/messages` namespace; per-user socket map; `notifyNewMessage`, `notifyUnreadCount` emitters
- [x] `MessagesModule` updated — registers `MessagesGateway`, imports `AuthModule` via `forwardRef`
- [x] `MessagesService.sendMessage` updated — calls `gateway.notifyNewMessage` + `gateway.notifyUnreadCount` after save
- [x] `main.ts` — `helmet({ contentSecurityPolicy: false })` so socket.io handshake is not blocked
- [x] `tests/unit/messages/messages.gateway.spec.ts` — 10 tests (connect, disconnect, notify events)
- [x] `tests/unit/messages/messages.service.spec.ts` — updated to mock `MessagesGateway`

#### Frontend
- [x] `useSocket` hook — creates authenticated socket.io-client connection to `/messages` namespace; useRef prevents double-connect in Strict Mode
- [x] `useUnreadCount` hook — wraps React Query (60s poll) + socket `unread_count_changed` listener
- [x] `AppShell` — replaces inline 10s unreadCount poll query with `useUnreadCount()` hook
- [x] Messages page — imports `useSocket`, adds `new_message` / `conversation_updated` socket listeners; reduces poll from 5s to 60s

---

## Sprint 12 — Admin Dashboard ✅ COMPLETE

**Goal:** Give admins a management UI for verification requests and user roles, completing the verified badge loop end-to-end.

### Backend
- [x] `AdminModule` (`src/admin/`) — `AdminService` + `AdminController` registered in `AppModule`
- [x] `GET /admin/stats` — counts of users, profiles, listings, events, posts
- [x] `GET /admin/users?page&limit` — paginated user list with profile join, ordered by createdAt DESC
- [x] `PATCH /admin/users/:id/role` — promote or demote a user (validates against allowed role values)
- [x] All admin routes protected with `JwtAuthGuard + RolesGuard + @Roles('admin')`
- [x] `tests/unit/admin/admin.service.spec.ts` — 7 tests covering getStats, getUsers, setUserRole

### Frontend
- [x] `useAuth` store updated — added `role: string | null`; parsed from JWT payload on login via `parseJwtRole()`; persisted to localStorage; exposed in `partialize`
- [x] `AppShell` — Admin link (ShieldCheck icon) shown in desktop sidebar only when `role === 'admin'`
- [x] `/admin` page — redirects non-authenticated users to `/login`, non-admins to `/feed`
- [x] Stats row — 4 cards: Users, Listings, Events, Posts (skeleton shimmer while loading)
- [x] Verification Requests tab — lists pending requests with Approve / Deny buttons; invalidates on action
- [x] Users tab — paginated user list with role color badge; role dropdown per row (hidden for own account); pagination controls

### To activate
Run this SQL against your database to make your account an admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'carloskfe@gmail.com';
```
Then log out and back in so the new JWT carries `role: admin`.

---

## Sprint 13 — Transactional Email Notifications ✅ COMPLETE

**Goal:** Re-engage users who are offline by sending email for key events.

### Backend
- [x] `EmailModule` + `EmailService` — Resend provider via native `fetch`; graceful no-op when `EMAIL_API_KEY` absent; `@Global()` module
- [x] Email templates: verification approved/denied, new message, new follower, new review
- [x] `NotificationsService.sendEmail()` — fires alongside in-app notification; gated by type and `emailNotificationsEnabled` preference
- [x] `emailNotificationsEnabled: boolean` column on `UserEntity` (default `true`); migration `1700000000007-AddEmailNotificationsEnabled.ts`
- [x] `GET /notifications/email-settings` — returns current preference
- [x] `PATCH /notifications/email-settings` — toggles preference
- [x] `review` type wired into email triggers (fires on new profile review with star rating in subject)
- [x] Unsubscribe link in every email footer (CAN-SPAM) — links to `/profile#notifications`

### Frontend
- [x] `EmailNotificationsSection` toggle card on `/profile` page (anchored at `#notifications`)
- [x] Toggle fetches current setting, PATCH on click, optimistic UI via query invalidation

### Tests
- [x] `tests/unit/notifications/notifications.service.spec.ts` — 18 new tests: getEmailSettings, updateEmailSettings, review email trigger, opt-out gating (254 total passing)

### To activate
Set `EMAIL_API_KEY` (Resend API key) and `EMAIL_FROM` (e.g. `AutoGuildX <noreply@autoguildx.com>`) in production env.

---

## Sprint 14 — Courses & Certifications ✅ COMPLETE

**Goal:** Let automotive experts create structured courses with lessons; issue certificates on completion.

### Backend
- [x] `CourseEntity` — title, slug (auto-unique), description, thumbnailUrl, price, tags, published, lessonCount, enrollmentCount
- [x] `LessonEntity` — courseId, title, content, videoUrl, order, durationMinutes
- [x] `EnrollmentEntity` — userId + courseId unique pair, completedAt
- [x] `LessonProgressEntity` — userId + lessonId unique pair, courseId (denormalized)
- [x] `CertificateEntity` — userId + courseId unique, certificateNumber (`AGX-{year}-{8hexChars}`)
- [x] `CoursesService` — CRUD, lesson CRUD, enroll, completeLesson (auto-issues cert at 100%), getProgress, getCertificate, getMyCertificates
- [x] `CoursesController` — 16 REST routes; public browse with OptionalJwtAuthGuard; protected mutation routes with JwtAuthGuard
- [x] `CoursesModule` registered in `AppModule`; migration `1700000000008-AddCourses`
- [x] `tests/unit/courses/courses.service.spec.ts` — 26 tests covering all service methods (280 total passing)

### Shared types
- [x] `packages/shared/src/types/course.ts` — Course, Lesson, Enrollment, Certificate interfaces

### Frontend
- [x] `/courses` — browseable grid, search, free/paid badge, enrollment count
- [x] `/courses/new` — create form: title, description, thumbnail upload, price, tag picker
- [x] `/courses/[id]` — detail: lesson list with completion checkmarks, enroll CTA, progress bar, certificate badge if earned
- [x] `/courses/[id]/learn` — split-pane player: lesson sidebar with completion state, content + video iframe, Mark Complete button, prev/next navigation; instructor can add/delete lessons inline
- [x] AppShell — Courses nav item (GraduationCap icon)
- [x] `/profile` — CertificatesSection shows earned certificates with certificate numbers

---

## Sprint 15 — Profile Banner (LinkedIn/FB-style Layout) ✅ COMPLETE

**Goal:** Upgrade the user profile page to a richer identity surface consistent with professional networks.

- [x] `profileBannerUrl` (nullable) on `ProfileEntity`; `CreateProfileDto` updated; migration `1700000000010-AddProfileBanner`
- [x] `profileBannerUrl` added to shared `Profile` type
- [x] `/profile` — full-width 160px banner (click anywhere to upload, hover overlay "Change cover photo"); 80px avatar overlapping banner edge with `ring-4` background separator; "Edit profile" button in action row; name/verified badge/role/location/followers/bio/tags below
- [x] `/profile/[id]` — same banner layout read-only; Share + Message + Follow/Unfollow action buttons inline in header row (compact, `text-xs`)

---

## Sprint 16 — Auth Hardening + Account Settings ✅ COMPLETE

**Goal:** Email verification on signup, password reset, and a full account settings page — prerequisites for beta launch.

### Backend
- [x] `emailVerified`, `emailVerificationToken`, `passwordResetToken`, `passwordResetExpiry` columns on `UserEntity`; migration `1700000000011-AddAccountSecurity`
- [x] `POST /auth/verify-email` — validate token, set `emailVerified = true`, clear token
- [x] `POST /auth/resend-verification` — regenerate token, resend email (NotFoundException if email not found)
- [x] `POST /auth/forgot-password` — generate 1-hour reset token, send email (NotFoundException if email not found)
- [x] `POST /auth/reset-password` — validate token + expiry, update password hash, clear token
- [x] `PATCH /auth/change-password` — verify current password, update hash (JwtAuthGuard)
- [x] `DELETE /auth/account` — permanently delete authenticated user (JwtAuthGuard)
- [x] Email templates: `verifyEmail(url)`, `passwordReset(url)` added to `email.templates.ts`
- [x] Firebase signup marks `emailVerified: true` automatically
- [x] `signup`, `login`, `loginWithFirebase` responses now include `emailVerified` field

### Frontend
- [x] `/verify-email` — "Check your inbox" banner when no token; auto-calls verify API when `?token=` present; success redirects to `/onboarding`; resend form on error
- [x] `/forgot-password` — email input, calls `/auth/forgot-password`, shows success state with email confirmation
- [x] `/reset-password` — new password + confirm form, validates token from query param, redirects to `/login` on success
- [x] `/settings` — account management page: plan/subscription section (current tier + UpgradeModal), change password form, email notifications toggle, danger zone (delete account with `DELETE` confirmation)
- [x] AppShell — Settings link (gear icon) in desktop sidebar for authenticated users
- [x] Login page — "Forgot password?" link below password field
- [x] Signup page — redirects to `/verify-email` instead of `/onboarding` after email signup

### Tests
- [x] `tests/unit/auth/auth.service.spec.ts` — updated with `EmailService` + `ConfigService` mocks; 27 tests covering all new methods (298 total passing)

---

## Sprint 17 — Marketplace Beta-Ready ✅ COMPLETE

**Goal:** Sellers can fully manage their listings; browse gets category filter and sort; seller profile is linked from listing detail.

### Backend
- [x] `GET /listings/my` — returns current user's listings (all statuses, ordered by createdAt DESC)
- [x] `sort` param added to `GET /listings` (`newest` / `price_asc` / `price_desc` / `featured`)
- [x] `status` field added to `UpdateListingDto` (`active` / `sold` / `draft`)
- [x] `findById` now includes `relations: ['user', 'user.profile']` for seller profile name

### Frontend
- [x] `/marketplace/manage` — My Listings dashboard: thumbnail, title, price, status badge, Edit / Mark as Sold / Mark Active / Delete actions; delete confirmation modal
- [x] `/marketplace/[id]/edit` — pre-filled edit form (all fields); owner guard redirects non-owners; saves via `PATCH /listings/:id`
- [x] `/marketplace/page.tsx` — category filter chips (13 categories), sort selector (Newest/Price Low-High/Price High-Low/Featured first), "My Listings" button for authenticated users, thumbnail on listing cards
- [x] `/marketplace/[id]/page.tsx` — Edit button, Mark as Sold / Relist toggle, status badge for owner; "View seller profile" link for buyers

### Tests
- [x] `tests/unit/listings/listings.service.spec.ts` — added sort tests (price_asc/price_desc/featured) and findByUser tests (303 total passing)

---

## Sprint 18 — Courses Beta-Ready ✅ COMPLETE

**Goal:** Instructors can fully manage their courses; students have a learning dashboard; certificate is downloadable.

### Frontend (all backend endpoints already existed)
- [x] `/courses/manage` — two-tab page: "Teaching" (own courses: thumbnail, stats, publish/unpublish toggle, edit link, delete with confirmation) and "Learning" (enrolled courses with progress bar, continue link, certificate link)
- [x] `/courses/[id]/edit` — pre-filled course edit form (title, description, level, price, thumbnail, objectives, requirements, tags); instructor-only guard; PATCH on submit
- [x] `/courses/[id]/learn` — lesson edit added inline in sidebar: pencil icon per lesson opens edit form (title, content, video URL, duration); PATCH /courses/:id/lessons/:lessonId on save
- [x] `/courses/[id]/certificate` — visual printable certificate page (certificate number, course name, instructor, date, Print/Save PDF button)
- [x] `/courses/page.tsx` — "My Hub" button in header for authenticated users
- [x] `/courses/[id]/page.tsx` — "Edit Course" + "Manage Lessons" buttons for instructor; "View Certificate" button when certificate earned

---

## Sprint 19 — Admin Team Profile ✅ COMPLETE

**Goal:** AutoGuildX has a verified branded presence on its own platform — a seed account + a public /team landing page.

### Backend
- [x] `isTeamAccount: boolean` column on `UserEntity` (default false); migration `1700000000012-AddTeamAccount`
- [x] `ProfilesService.getTeamProfile()` — finds profile via `user.isTeamAccount = true`
- [x] `GET /profiles/team` — public endpoint returning the team profile
- [x] `apps/api/src/seed/seed-team.ts` — idempotent seed: creates `team@autoguildx.com` user (role: admin, emailVerified, isTeamAccount) + profile (name: AutoGuildX, bio, tags, isVerified); updates flags if already exists
- [x] `npm run seed:team` script added to `apps/api/package.json`

### Frontend
- [x] `/team` — public landing page: hero, mission, values grid, platform overview, team profile card (fetched from `GET /profiles/team`, links to `/profile/[userId]`), Join the Guild CTA, footer
- [x] AppShell sidebar footer — "About / Team" link added above Privacy Policy

### To activate
Run the seed script against your production database:
```bash
TEAM_SEED_PASSWORD=YourSecurePassword npm run seed:team --workspace=apps/api
```
Then log in as `team@autoguildx.com` and update the profile avatar and banner via `/profile`.
