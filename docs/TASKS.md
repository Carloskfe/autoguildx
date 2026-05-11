# AutoGuildX — Sprint Board

Status legend: `[x]` done · `[ ]` pending · `[-]` in progress

---

## Backlog (unscheduled)

- [ ] **Admin user deletion** — `DELETE /admin/users/:id` endpoint (hard-deletes user + cascades to profile, posts, listings, etc.); confirmation modal in `/admin` Users tab with "Type DELETE to confirm" guard. Self-deletion already exists in `/settings`; this adds admin-initiated deletion for moderation purposes.

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

---

## Sprint 20 — SEO + Error Resilience ✅ COMPLETE

**Goal:** Make public pages indexable and the app resilient to unhandled errors before launch.

### SEO
- [x] Root layout — `title.template` (`%s | AutoGuildX`), `metadataBase`, `twitter:card: summary_large_image`, `og:siteName`
- [x] `apps/web/public/robots.txt` — allows public pages, blocks auth-only pages; references sitemap
- [x] `apps/web/src/app/sitemap.ts` — static sitemap covering 7 public routes; respects `NEXT_PUBLIC_SITE_URL` env var
- [x] `/team` — `team/layout.tsx` exports static metadata (Server Component pattern for `'use client'` page)
- [x] `/marketplace/[id]` — `generateMetadata` fetches listing title, price, description, og:image (60s revalidate)
- [x] `/profile/[id]` — `generateMetadata` fetches profile name, bio, og:image (60s revalidate)
- [x] `/events/[id]` — `generateMetadata` fetches event title and description (60s revalidate)
- [x] All three dynamic pages refactored: content extracted to `PageClient.tsx`; `page.tsx` is now a Server Component wrapper
- [x] `API_URL` env var added for server-side fetches in Docker (container-to-container); defaults to `NEXT_PUBLIC_API_URL`
- [x] `NEXT_PUBLIC_SITE_URL` env var added for sitemap base URL
- [x] `docker-compose.yml` — `API_URL=http://api:3001/api/v1` injected into web service at runtime

### Error resilience
- [x] `apps/web/src/app/error.tsx` — global React error boundary (Try again / Go to Feed)
- [x] `apps/web/src/app/not-found.tsx` — 404 page (Go Home / Browse Marketplace)

### Docs
- [x] `docs/PRD.md` — removed duplicate "Courses and certifications" from post-MVP roadmap; marked Sprint 20 complete in beta checklist
- [x] `docs/TASKS.md` — Sprint 20 logged

---

## Sprint 21 — Mobile Responsiveness ✅ COMPLETE

**Goal:** Make all pages fully usable on phone-sized screens before launch.

### Pass 1 — Structural fixes
- [x] **iOS input zoom** — added `text-base` (16px) to `.input` class in `globals.css`; Safari auto-zooms inputs with font-size < 16px
- [x] **Mobile bottom nav** — reduced from 8 items to 5 (Feed, Discover, Market, Messages, Profile); AGXTopics/Courses/Events remain in desktop sidebar; labels now `truncate` to prevent overflow
- [x] **Courses/learn sidebar** — was `hidden md:flex` with no mobile access; now opens as a full-screen overlay via "Lessons" button; defaults to closed on mobile, open on desktop (responsive `useEffect`)

### Pass 2 — Interaction + modal fixes
- [x] **Feed reaction picker** — removed `onMouseEnter`/`onMouseLeave` hover handlers (useless on touch); added tap-outside dismiss overlay (`fixed inset-0 z-[5]`); emoji buttons have `p-1` padding for larger touch targets
- [x] **Feed share dropdown** — same tap-outside overlay pattern; tap anywhere outside closes the menu
- [x] **NotificationPanel width** — added `max-w-[calc(100vw-1rem)]` so the 320px panel never overflows the viewport on small phones
- [x] **UpgradeModal scroll** — added `max-h-[90vh] overflow-y-auto`; 3 stacked tier cards exceed 700px on mobile without it
- [x] **`scrollbar-hide` utility** — defined in `globals.css` (`@layer utilities`); used by AGXTopics category filter and Discover horizontal scroll chips

### Pass 3 — Profile, compose, AGXTopics
- [x] **Profile banner upload hint** — hover overlay `hidden md:flex`; added persistent camera badge (`md:hidden`) in bottom-right corner so mobile users know the banner is tappable
- [x] **Profile avatar overlay** — `md:opacity-0 md:group-hover:opacity-100`; always visible on mobile so users know they can tap to change their photo
- [x] **Compose toolbar grouping** — visibility picker + Post button wrapped in shared `ml-auto` container; they always stay together when the toolbar wraps to a second row on narrow screens
- [x] **AGXTopics sort tabs** — replaced undefined `bg-surface-800` Tailwind class with `bg-surface-card`

### Pass 4 — Manage dashboards + certificate
- [x] **Certificate card padding** — `p-10` → `p-6 sm:p-10`; 40px padding on both sides left only 263px content width on a 375px phone
- [x] **Marketplace manage action buttons** — `p-1.5` → `p-2` (28px → 32px touch target); meta row `flex` → `flex flex-wrap` so price/category/location/age don't overflow on narrow screens
- [x] **Courses manage action buttons** — same `p-1.5` → `p-2` touch target fix

### Full page audit result
Every page audited; issues found and fixed only where real breakage or UX degradation existed. Pages confirmed clean: `/login`, `/signup`, `/onboarding`, `/events` list, `/notifications`, `/team`, `/admin`, `/courses/[id]` (has `lg:hidden` mobile CTA block), `/discover`, `/marketplace/new`, `/events/new`, all AGXTopics forms, `/settings`, auth flows, `ReviewSection`, `ForumCommentThread`.

---

## Sprint 23 — Production Server Deployment (Traefik/Contabo)

**Goal:** Deploy AutoGuildX to the shared Contabo VPS. Traffic routed via Traefik v2.11 (already running alongside Noetia). CI/CD via GitHub Actions SSH deploy on push to main.

**Server:** `84.247.140.175` · Ubuntu 24.04 · `/opt/autoguildx/` · SSH as root
**DNS:** Already live in Cloudflare — gray proxy (do not orange-cloud, Traefik handles SSL)
**Traefik:** v2.11 at `/opt/traefik/` — do NOT touch. Shared `proxy` Docker network already exists.

### Code changes (next session)

- [ ] Create `docker-compose.server.yml` at repo root — Traefik labels, `agx_net` + `proxy` networks, no nginx (see CLAUDE.md for full spec)
- [ ] Update `apps/web/Dockerfile` build stage — add `ENV NEXT_PUBLIC_API_URL=https://autoguildx.com/api`, `ENV NEXT_PUBLIC_OAUTH_URL=https://autoguildx.com/api`, `ENV INTERNAL_API_URL=http://api:4000` before `npm run build` (NEXT_PUBLIC_* baked at compile time)
- [ ] Update `apps/api/Dockerfile` — verify `dist/data-source.js` is included in production build output (required for migration:run:prod)
- [ ] Add migration scripts to `apps/api/package.json`: `"migration:run:prod": "node node_modules/typeorm/cli.js migration:run -d dist/data-source.js"` and `"migration:revert:prod"`
- [ ] Make Stripe initialization conditional in `SubscriptionsService` + webhooks controller — `this.stripe = stripeKey ? new Stripe(stripeKey) : null`; add `requireStripe()` guard method; replace all `this.stripe.xxx` calls. Prevents crash at startup when key is absent.
- [ ] Create `.github/workflows/cd.yml` — SSH deploy via `appleboy/ssh-action@v1.2.0` on push to main; runs `git pull`, `docker compose up -d --build`, migration, image prune
- [ ] Verify/fix NestJS global prefix vs Traefik `/api` strip — Traefik strips `/api` before forwarding; NestJS may need prefix changed from `api/v1` to `v1` to avoid route mismatch. Check `apps/api/src/main.ts`.

### Ops (done on server — not code changes)

- [ ] SSH in: `ssh root@84.247.140.175`
- [ ] Clone repo: `git clone <repo-url> /opt/autoguildx`
- [ ] Create `/opt/autoguildx/.env.production` — all vars (DB_NAME, DB_USER, DB_PASS, DB_HOST=db, WEB_URL, API_URL, JWT_SECRET, Firebase, Resend, Stripe, AWS). Generate secrets: `openssl rand -base64 32`
- [ ] Add `DEPLOY_SSH_KEY` to GitHub repo secrets — key is at `/root/.ssh/deploy_key` on server: `ssh root@84.247.140.175 'cat /root/.ssh/deploy_key'`
- [ ] First-time deploy: `docker compose --env-file .env.production -f docker-compose.server.yml up -d --build`
- [ ] Run migrations: `docker compose --env-file .env.production -f docker-compose.server.yml exec -T api npm run migration:run:prod`
- [ ] Verify: `docker ps` · `curl -sk https://autoguildx.com/api/health` · CORS check (see CLAUDE.md)

### Verification commands
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
curl -sk https://autoguildx.com/api/health
curl -sk -X OPTIONS https://autoguildx.com/api/health \
  -H "Origin: https://autoguildx.com" \
  -H "Access-Control-Request-Method: POST" -I
docker logs autoguildx-api-1 --tail=30
docker logs autoguildx-web-1 --tail=30
```

---

## Sprint 22 — Production Docker Deployment ✅ COMPLETE

**Goal:** VPS-ready production stack with nginx reverse proxy, Let's Encrypt SSL, and a one-command deploy script.

- [x] `docker-compose.prod.yml` — standalone production compose; nginx on 80/443 terminates SSL; api and web have no external port bindings; postgres password driven by env var; `DOMAIN_NAME` drives CORS, build args, and sitemap URL
- [x] `nginx/nginx.conf.template` — processed by nginx Docker image's built-in envsubst on startup; routes `/api/*` and `/socket.io/*` to api container (with WebSocket upgrade), everything else to web container; HTTP→HTTPS redirect with ACME challenge pass-through
- [x] `scripts/init-letsencrypt.sh` — first-time certificate setup: creates dummy cert, starts nginx, runs certbot webroot challenge for domain + www subdomain, reloads nginx with real cert
- [x] `scripts/deploy.sh` — rolling deploy: `git pull`, rebuild images, restart api (migrations auto-run on startup), health-check poll (60s timeout), restart web, prune old images
- [x] `.env.prod.example` — documents required production env vars (`DOMAIN_NAME`, `POSTGRES_PASSWORD`, `EMAIL`)
- [x] `.gitignore` — added `certbot/` (private keys) and `.env.prod`
- [x] `CLAUDE.md` — Production deployment section added with step-by-step commands and env var table
