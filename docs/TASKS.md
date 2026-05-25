# AutoGuildX — Sprint Board

Status legend: `[x]` done · `[ ]` pending · `[-]` in progress

---

## Backlog (unscheduled)

- [x] **Multilingual support — English / Spanish** ✅ Sprint 25 COMPLETE

- [x] **UI/UX overhaul — Rich profile + automotive brand identity** ✅ Sprint 26 COMPLETE

- [ ] **Smoke-test password reset flow end-to-end** — All code exists and is wired up, but the flow has never been manually verified on production.
  - Go to `https://autoguildx.com/forgot-password` → enter a real email → check inbox for reset email
  - Verify the link in the email points to `https://autoguildx.com/reset-password?token=...` (not localhost)
  - Click the link → set a new password → verify login works with the new password
  - Requires `RESEND_API_KEY` to be set in `.env.production` (it was configured during server setup)
  - If no email arrives: check `docker logs autoguildx-api-1 | grep -i resend` for errors

- [-] **React Native mobile app** — Native iOS and Android app for AutoGuildX. **Core screens wired. Detail screens shipped Sprint 27.**

  **Completed:**
  - `apps/mobile/` — Expo SDK 54, Expo Router v6, isolated from npm workspaces
  - Auth screens: Login (email + Google/Facebook/Apple), Signup, Forgot Password
  - Tab screens (all wired to live API): Feed, Discover, Marketplace, Messages, Profile
  - `useAuth` (Zustand + SecureStore), Axios API client, dark theme
  - Feed: post cards with reaction picker, compose modal (post creation)
  - Marketplace: listing grid, search, → listing detail
  - `app/listing/[id].tsx` — hero image, price/meta/description, Message Seller CTA
  - `app/conversation/[id].tsx` — message bubble thread, 10s poll, send
  - `app/listing/new.tsx` — create listing form (type, category, price, description)
  - Stack transitions registered in `_layout.tsx`

  **EAS Build config (code complete — `0aee018`):**
  - `eas.json`: development / preview (APK, internal) / production (AAB) profiles; `appVersionSource: remote`; `autoIncrement: true` on production
  - `app.json`: `runtimeVersion: { policy: sdkVersion }` + `updates.url` for OTA
  - `metro.config.js`: `EXPO_ROUTER_IMPORT_MODE` fallback so babel inlining works in build containers
  - `package.json`: removed unused `@autoguildx/shared` file dep (breaks EAS archive); added `build:android:*` and `submit:*` scripts

  **One-time ops to complete before first build (run from `apps/mobile/`):**
  ```bash
  # 1. Install EAS CLI globally (if not already)
  npm install -g eas-cli

  # 2. Log in to your Expo account
  eas login

  # 3. Build a preview APK for Android (internal distribution — share via QR)
  npm run build:android:preview
  # EAS will generate and store an Android keystore automatically on first run.
  # Scan the QR code or download the APK from https://expo.dev/accounts/[you]/projects/autoguildx/builds

  # 4. Build production AAB for Play Store
  npm run build:android:production
  # Submit to Play Store internal testing track:
  npm run submit:android
  # (Requires a Google Play service account JSON — follow prompt from EAS CLI)

  # 5. iOS — requires Apple Developer account ($99/yr)
  npm run build:ios:preview       # AdHoc IPA for TestFlight internal
  npm run build:ios:production    # Production IPA
  npm run submit:ios              # Submit to App Store Connect
  # EAS CLI will walk through Apple certificate/provisioning profile setup interactively

  # 6. OTA updates (after first build is installed on a device)
  npx eas update --channel production --message "Sprint 28 fixes"
  ```

  **Google Sign-In** will work automatically in EAS production builds (not Expo Go).
  `GOOGLE_ANDROID_CLIENT_ID` and `GOOGLE_WEB_CLIENT_ID` are hardcoded in `lib/socialAuth.ts` — no secrets needed.

  **Remaining for MVP:**
  - Complete Play Store/App Store listing setup (screenshots, description, privacy policy URL)
  - `TEAM_SEED_PASSWORD` and admin SQL still needed on the server (Sprint 23 ops)

  **Key monorepo gotchas (documented for next session):**
  - `apps/mobile` is EXCLUDED from npm workspaces to prevent React deduplication — run `npm install` from `apps/mobile/` directly, not from root
  - `npm run tunnel` starts Expo with correct env vars; use `--clear` after package changes
  - `google-services.json` is gitignored — keep locally at `apps/mobile/google-services.json`
  - Expected versions: `react@19.1.0`, `react-native@0.81.5`, `expo@~54.0.33`

  **Package identifiers:**
  - Android: `com.autoguildx.app`
  - iOS Bundle ID: `com.autoguildx.app`

  **Recommended stack:**
  - React Native (Expo managed workflow for faster iteration)
  - React Navigation v6 — stack + tab navigation
  - TanStack React Query — same data-fetching pattern as web
  - Zustand — same auth store pattern as web (`token`, `userId`, `role`)
  - Axios — same API client pattern, auto-attach JWT
  - Socket.IO client — real-time messages (same `/messages` namespace)
  - `@react-native-firebase/auth` — Google, Facebook, Apple login
  - Expo SecureStore — replace `localStorage` for token persistence

  **Core screens (MVP):**
  - Auth: Login, Signup, Forgot Password, Verify Email
  - Feed: post list, compose, reactions, comments
  - Marketplace: listing grid, filters, detail, create/edit
  - Profile: own profile, public profile, follow/unfollow
  - Messages: conversation list, thread, real-time
  - Notifications: list, read/unread
  - Discover: search with filters
  - Events: list, detail, RSVP
  - Courses: browse, detail, learn player, certificate
  - AGXTopics: forum list, post list, post detail
  - Settings: change password, delete account, notifications toggle

  **What's already available from the web app:**
  - All API endpoints and DTOs (reuse `@autoguildx/shared` types)
  - JWT auth flow (email + all social providers)
  - Socket.IO real-time messaging
  - Firebase config (reuse same Firebase project, add mobile apps in console)

  **Ops before publishing:**
  - Add Android app in Firebase Console (package: `com.autoguildx.app`) for Google Sign-In on Android
  - Add iOS app in Firebase Console (bundle ID: `com.autoguildx.app`) for Google Sign-In on iOS
  - Google Play Console: create app with package `com.autoguildx.app`
  - Apple App Store Connect: create app with bundle ID `com.autoguildx.app` (requires Apple Developer account)
  - Add mobile app OAuth redirect URIs to Facebook App settings

- [x] **Enable Facebook login** — Firebase + Facebook App connected. Valid OAuth Redirect URI configured. Working on production as of 2026-05-19.
- [ ] **Enable Apple login (ops only — no code changes needed)** — Requires Apple Developer account ($99/year). See setup steps below.

  **Facebook — steps:**
  1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App → Consumer
  2. Add the "Facebook Login" product to the app
  3. In Firebase Console → Authentication → Sign-in providers → Facebook: enable it and paste the **App ID** and **App Secret** from your Facebook App
  4. Copy the OAuth redirect URI shown in Firebase and paste it into Facebook App → Facebook Login → Settings → Valid OAuth Redirect URIs
  5. In Facebook App → Settings → Basic: add `autoguildx.com` to App Domains
  6. Set app to Live mode in Facebook dashboard

  **Apple — steps:**
  1. Requires an **Apple Developer account ($99/year)** at [developer.apple.com](https://developer.apple.com)
  2. Register an App ID (Identifiers → App IDs) with "Sign In with Apple" capability enabled
  3. Create a Service ID (Identifiers → Services IDs) — this is the OAuth client ID Firebase uses; set the domain to `autoguildx.com` and the return URL to `https://autoguildx.com/__/auth/handler`
  4. Create a Sign In with Apple private key (Keys → create key, enable Sign In with Apple, download the `.p8` file)
  5. In Firebase Console → Authentication → Sign-in providers → Apple: enable it and paste the Service ID, Team ID, Key ID, and private key content
  6. Rebuild the web container after enabling in Firebase (no env var changes needed — Firebase config is already in `.env.production`)

  **After setup:** no rebuild needed for Facebook. Apple requires verifying the domain association file is served at `https://autoguildx.com/.well-known/apple-developer-domain-association.txt` — Firebase handles this automatically via the `/__/auth/handler` route hosted by Firebase Hosting (not needed if using popup flow, which we do).

- [x] **Landing page — redesigned value props + courses section** — Rework `apps/web/src/app/page.tsx` value props section and add a courses banner.

  **1. Merge into a 2-card grid** (was 3 equal cards). "Build Your Presence" and "Connect With Peers" become one combined card:

  | Card | Icon | Title | Description |
  |---|---|---|---|
  | Left | `Car` | **Build Your Presence & Connect** | Showcase your work and builds in a professional profile. Follow other builders, attend events, and grow your reputation in a community that knows your craft. |
  | Right | `Wrench` | **Find Trusted Parts** | Browse a curated marketplace of rare parts and specialized services from verified experts. |

  Each card gets a brand-orange icon badge:
  ```tsx
  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
    <Icon className="w-5 h-5 text-brand-500" />
  </div>
  ```
  Grid changes from `md:grid-cols-3` to `md:grid-cols-2`.

  **2. Add a full-width "Develop or Reshape Your Skills" banner** below the 2-card grid, above the footer. Single wide card spanning the full `max-w-5xl` container:
  - `GraduationCap` icon (brand orange, large)
  - Headline: **"Develop or Reshape Your Skills"**
  - Subtitle: *"Learn from certified experts or teach what you know. Complete courses and earn certificates that live on your profile."*
  - CTA button → `/courses` ("Browse Courses")
  - Layout: icon + text left, button right on desktop; stacked on mobile
  - Visual: `border border-brand-500/30 bg-brand-500/5` to distinguish from the plain cards above

---

## Sprint 29 — i18n Completeness ✅ COMPLETE

**Goal:** Make the entire app fully multilingual — once a user picks a language, every string they see (menus, legal pages, error screens, admin UI, instructions) is in that language. Also persist the language preference across sessions.

### Translation keys
- [x] Add `legal`, `privacy`, `terms`, `cookies_policy`, `disclaimer`, `admin`, `error_page`, `not_found` namespaces to `en.json` and `es.json` (~300 new keys in each file, fully translated)

### Legal pages (privacy, terms, cookies, disclaimer)
- [x] `[locale]/privacy/page.tsx` — async server component, all content via `useTranslations('privacy')`
- [x] `[locale]/terms/page.tsx` — async server component, all content via `useTranslations('terms')`
- [x] `[locale]/cookies/page.tsx` — async server component, all content via `useTranslations('cookies_policy')`
- [x] `[locale]/disclaimer/page.tsx` — async server component, all content via `useTranslations('disclaimer')`
- [x] Footer link labels in all 4 legal pages now use `nav` namespace translations
- [x] `generateMetadata` in each legal page returns translated title

### Error and 404 pages
- [x] `[locale]/error.tsx` — `useTranslations('error_page')`: heading, title, body, buttons
- [x] `[locale]/not-found.tsx` — `getTranslations('not_found')`: code, title, body, buttons

### Admin dashboard
- [x] `[locale]/admin/page.tsx` — `useTranslations('admin')`: title, subtitle, all stat labels, tab names, button labels, role dropdown options, delete modal, pagination, users total count

### Locale persistence
- [x] `LocaleSwitcher.tsx` — writes `NEXT_LOCALE` cookie (1-year expiry, `SameSite=Lax`) on every language switch
- [x] `middleware.ts` — comment corrected; `localeDetection: true` already reads the `NEXT_LOCALE` cookie automatically
- [x] Settings page now shows language switcher in a dedicated "Language" section using the existing `language_section` / `language_label` keys

---

## Sprint 28 — Unified Visual Polish ✅ COMPLETE

**Goal:** Consistent look and feel across every page — typography, card interactivity, and profile layouts.

### Design system
- [x] `.card-interactive` — added `hover:-translate-y-0.5` subtle lift + `shadow-xl shadow-black/40`
- [x] `.page-heading` — new CSS class: Barlow Condensed Black, 2xl, tight tracking; applied to every page title
- [x] `courses.subtitle` translation key added (EN + ES)

### Page-level typography — all `h1` now use `.page-heading`
- [x] Feed, Marketplace, Events, Discover, Notifications, Messages
- [x] AGXTopics list + forum detail, Courses (+ subtitle via `t('subtitle')`, `max-w-6xl` → `max-w-5xl`)

### Card interactivity — standardized across all pages
- [x] Marketplace listing cards → `card-interactive block`
- [x] Events cards → `card-interactive block`
- [x] Discover result cards (profiles / listings / events) → `card-interactive`
- [x] Courses → `card-interactive !p-0` with thumbnail scale on hover
- [x] AGXTopics forum + post cards → silver border transition
- [x] Feed posts, profile post cards → silver border transition

### Profile pages (own + public)
- [x] `max-w-2xl` → `max-w-3xl` on both pages
- [x] Name heading → `font-heading font-black text-2xl tracking-tight`
- [x] Role badge → brand-tinted pill (`bg-brand-500/10 border-brand-500/25 text-brand-400`)
- [x] Avatar ring → `ring-surface` (semantic)
- [x] Banner default → atmospheric dark gradient + radial brand glow at top-left
- [x] Stats row → centered columns with Condensed Black numbers + vertical divider
- [x] Tags → `section-chip` (design system)
- [x] Section labels (Posts, Certificates) → consistent `text-xs font-bold tracking uppercase` pattern
- [x] Public profile: all hardcoded strings → `tp()` translations (followers, following, Posts, No posts yet, Edit profile, Share, Message, Follow, Unfollow)
- [x] Reviews section: redundant inner `max-w-2xl` wrapper removed

---

## Sprint 27 — Mobile Detail Screens ✅ COMPLETE

**Goal:** Make the mobile app fully navigable — wire listing detail, message threads, and post compose.

- [x] `app/listing/[id].tsx` — full detail: hero image, price, category/type/location meta, description, seller name, "Message Seller" CTA (creates/opens conversation)
- [x] `app/conversation/[id].tsx` — full message thread: bubble UI, mine/theirs styling, 10s poll, send with `KeyboardAvoidingView`, auto-scroll to latest
- [x] `app/listing/new.tsx` — create listing: title, price, type (part/service), inline category dropdown, description, location; invalidates listings cache on success
- [x] Feed `feed.tsx` — replaced stale `/posts/:id/like` with reactions API (`POST /posts/:id/react`); added emoji reaction picker; added compose modal (pageSheet) for creating posts
- [x] `_layout.tsx` — registered `listing/*` and `conversation/*` with `slide_from_right` / `slide_from_bottom` transitions

---

## Sprint 26 — Visual Overhaul + Rich Profile Sections ✅ COMPLETE

**Goal:** Elevate the platform visual identity to feel automotive-premium; expose rich profile sections to users.

### Visual / Brand
- [x] **Barlow Condensed** loaded as `--font-heading` via next/font; `font-heading` Tailwind token; `.display` CSS utility for condensed black display headings
- [x] **Landing page** — eyebrow label, condensed hero headline, subtle radial glow, stats row (community / listings / courses), interactive card hover depth, `bg-surface-card/30` value props section
- [x] **AppShell header** — `font-heading` logo text, `shadow-sm shadow-black/40` for depth
- [x] **globals.css** — richer hover states: `btn-primary` gets `hover:shadow-brand-500/10`, `btn-secondary` border brightens to silver-500, `card` uses `transition-all`, `card-interactive` gets `hover:shadow-lg hover:shadow-black/30`
- [x] Brand orange already at `#e8610a` (brand-500) + `#d4550f` (brand-600); silver tokens present — confirmed Sprint 24

### Rich Profile Sections (discovered pre-built — verified complete)
- [x] `ProfileSectionEntity` — type enum (expertise / experience / build / certification / equipment), JSONB data, sortOrder
- [x] Migration `1700000000014-AddProfileSections`
- [x] `ProfileSectionsService` + `ProfileSectionsController` — CRUD, owner guard
- [x] `ProfileSections` component — collapsible groups, inline add/edit/delete forms per section type
- [x] Wired on `/profile` (isOwner=true) and `/profile/[id]` (isOwner check)
- [x] Shared types: `ProfileSection`, `ProfileSectionType`, `ExpertiseData`, `ExperienceData`, `BuildData`, `CertificationData`, `EquipmentData`
- [x] Unit tests: `tests/unit/profiles/profile-sections.service.spec.ts` (9 tests)

### i18n
- [x] `ProfileSections` component fully translated — all 30+ hardcoded strings replaced with `useTranslations('sections')`
- [x] `en.json` + `es.json` extended with `sections.*` namespace (EN/ES in sync)
- [x] Public profile `PageClient.tsx` — hardcoded `ROLE_LABELS` replaced with `profile.role_*` translation keys

---

## Sprint 25 — Multilingual EN/ES Support ✅ COMPLETE

**Goal:** Full English/Spanish internationalization across all pages and components using `next-intl` v3.

### Phase 1 — Infrastructure
- [x] Install `next-intl` v3, restructure all routes under `app/[locale]/`
- [x] `middleware.ts` — `Accept-Language` detection, `NEXT_LOCALE` cookie, redirect to `/en` or `/es`
- [x] `messages/en.json` — all UI strings extracted (~500 keys across 20 namespaces)
- [x] `messages/es.json` — full Spanish translation (ES LATAM, neutral vocabulary)
- [x] `LocaleSwitcher` component — EN | ES toggle in AppShell header and Settings page
- [x] `next.config.mjs` updated with `next-intl` plugin

### Phase 2 — Page wiring (major pages)
- [x] `AppShell` — nav labels, plan badges, post button, notifications
- [x] Landing page (`/`) — hero copy, card titles/bodies, courses banner
- [x] `/login`, `/signup`, `/onboarding`, `/verify-email`, `/forgot-password`
- [x] `/agxtopics` and all sub-routes — forum labels, sort tabs, vote actions
- [x] `/courses` and all sub-routes — browse, create, manage, learn, certificate
- [x] `/marketplace/new`, `/marketplace/manage`, `/marketplace/[id]/edit`
- [x] `/messages`, `/notifications`, `/events/new`, `/events/[id]`
- [x] `/marketplace/[id]`, `/profile/[id]`, `/admin`, `/team`

### Phase 3 — Remaining pages and components
- [x] `feed/page.tsx` — visibility options, unknown user, comment/compose placeholders, link limit, no-posts state
- [x] `discover/page.tsx` — filter labels, empty states
- [x] `events/page.tsx` — list labels, empty states, load more
- [x] `marketplace/page.tsx` — category filter, sort, search, empty states
- [x] `profile/page.tsx` — edit labels, role names, badge labels, email notification text
- [x] `reset-password/PageClient.tsx` — error messages, form labels, success states
- [x] `settings/page.tsx` — section headers, plan labels, form placeholders
- [x] `NotificationPanel.tsx` — notification text with i18n interpolation
- [x] `ReviewSection.tsx` — title, write/cancel, dimension labels, placeholder
- [x] `UpgradeModal.tsx` — error messages
- [x] `messages/en.json` + `messages/es.json` — extended with all Phase 3 keys (EN/ES perfectly in sync, 0 missing keys)

---

## Sprint 24b — Courses Udemy Parity ✅ COMPLETE

**Goal:** Close the gap between AutoGuildX courses and a Udemy-like experience. No AI features in this stage.

### Backend
- [ ] Wire `ReviewsModule` to accept `targetType: 'course'` — reuse existing review entity; add `courseId` nullable FK; update `ReviewsService.getSummary()` to handle course targets
- [ ] Add `previewVideoUrl` field to `CourseEntity` + migration
- [ ] Add `sort` query param to `GET /courses` — `popular` (enrollmentCount DESC) · `rating` (avg rating DESC) · `newest` (default, createdAt DESC)
- [ ] Paid course checkout — `POST /courses/:id/checkout` → Stripe Checkout Session (one-time); `checkout.session.completed` webhook → call `CoursesService.enroll()`; guard `enroll()` to reject paid courses without payment
- [ ] `CoursesService.enroll()` payment guard — `ForbiddenException('Payment required')` unless `price === 0` or instructor or webhook path
- [ ] Completion email — send congrats email via `EmailModule` when `checkAndIssueCertificate` issues a certificate
- [ ] Unit tests for all modified/new service methods

### Frontend
- [ ] Star rating display on course cards (`/courses` page) — fetch avg rating per course or bundle with list response
- [ ] Star rating + review count in course detail hero (below title, above meta row)
- [ ] `ReviewSection` component on course detail page (below instructor section) — same component used on listing/profile pages, `targetType='course'`
- [ ] Course preview video player in sticky sidebar — if `previewVideoUrl` is set, show a play button over thumbnail; clicking opens inline `<video>` or YouTube embed
- [ ] Add `previewVideoUrl` field to course create/edit forms
- [ ] Sort dropdown on `/courses` catalog — "Newest · Most Popular · Top Rated"
- [ ] Progress bar on course cards for enrolled users — show `X% complete` below the card footer when the current user is enrolled

### Ops
- [ ] Register `POST /courses/webhook` in Stripe dashboard (or reuse `/subscriptions/webhook` with type discrimination)
- [ ] Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in `.env.production`

---

- [ ] **Paid course checkout** — Gate enrollment on payment for courses with `price > 0`. Currently any user can enroll in a paid course for free.
  - **Backend:** `POST /courses/:id/checkout` → create a Stripe Checkout Session (one-time payment, not subscription); on success webhook (`checkout.session.completed`) verify `metadata.courseId` + `metadata.userId` and call `CoursesService.enroll()`. Reuse the existing `SubscriptionsModule` Stripe instance or create a dedicated helper.
  - **Backend:** `CoursesService.enroll()` must reject paid courses without a completed payment — add a `paidOnly` guard that throws `ForbiddenException('Payment required')` unless the caller is the instructor or the webhook path.
  - **Frontend:** On `/courses/[id]`, replace the direct `enroll.mutate()` call for paid courses with a redirect to the Stripe Checkout session URL. Keep the direct enroll path for free courses (`price === 0`).
  - **Frontend:** Add `/courses/[id]/success` and `/courses/[id]/cancel` pages (or reuse the existing `/subscription/success|cancel` pattern) to handle post-checkout redirect.
  - **Ops:** Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env.production`. Register `POST /courses/webhook` (or reuse `/subscriptions/webhook` with type discrimination) in Stripe dashboard.
  - **Note:** Free courses (`price === 0`) must remain unaffected — no checkout, direct enroll as today.

- [x] **Admin user deletion** — `DELETE /admin/users/:id` endpoint (hard-deletes user + cascades to profile, posts, listings, etc.); confirmation modal in `/admin` Users tab with "Type DELETE to confirm" guard. Self-deletion already exists in `/settings`; this adds admin-initiated deletion for moderation purposes.

- [x] **First-time user onboarding tour** — Step-by-step guided tour shown once on first visit to the authenticated app. Re-openable via a "Take a tour" link in the AppShell sidebar footer.
  - **Library:** React Joyride (`react-joyride`) — React-native, TypeScript-ready, works with Next.js App Router
  - **Trigger:** `localStorage` key `agx_tour_seen`; set to `true` after tour completes or is dismissed. Check on mount in `AppShell` (only when `isAuthenticated`).
  - **Re-open:** "Take a tour" link in AppShell sidebar footer (above "About / Team"); sets `agx_tour_seen = false` then mounts tour
  - **Steps (5 total):**
    1. **Welcome** — Full-screen centered overlay (no target element). Headline: *"Welcome to AutoGuildX"*. Body: *"Where experience, knowledge and passion come together around cars."* CTA: "Start tour"
    2. **Profile** — Targets sidebar "Profile" nav item. *"Your professional identity. Showcase your work, earn a verified badge, and build your reputation in the automotive community."*
    3. **Marketplace** — Targets sidebar "Market" nav item. *"Buy, sell and discover parts, services and builds. List your own inventory or find exactly what your project needs."*
    4. **Courses** — Targets sidebar "Courses" nav item. *"Learn from experts or teach what you know. Complete courses and earn certificates that live on your profile."*
    5. **Feed** — Targets sidebar "Feed" nav item. *"Stay connected with the community. Share builds, react to posts, and follow the people who inspire you."*
  - **Style:** Dark overlay matching `surface-*` palette; "Next" / "Back" / "Skip tour" controls; brand-orange accent on active step dot
  - **No backend changes needed** — state is client-side only (`localStorage`)

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

## Sprint 23 — Production Server Deployment (Traefik/Contabo) ✅ COMPLETE

**Goal:** Deploy AutoGuildX to the shared Contabo VPS. Traffic routed via Traefik v2.11 (already running alongside Noetia). CI/CD via GitHub Actions SSH deploy on push to main.

**Server:** `84.247.140.175` · Ubuntu 24.04 · `/opt/autoguildx/` · SSH as root
**DNS:** Already live in Cloudflare — gray proxy (do not orange-cloud, Traefik handles SSL)
**Traefik:** v2.11 at `/opt/traefik/` — do NOT touch. Shared `proxy` Docker network already exists.

### Code changes ✅ COMPLETE

- [x] Create `docker-compose.server.yml` at repo root — Traefik labels, `agx_net` + `proxy` networks, no strip prefix (NestJS prefix `api/v1` + frontend base URL `/api/v1` means full path forwarded unchanged)
- [x] Update `apps/web/Dockerfile` build stage — ARG+ENV for all NEXT_PUBLIC vars (API URL, site URL, all Firebase vars); renamed `runner` stage to `production`
- [x] Update `apps/api/Dockerfile` — renamed `runner` to `production`; EXPOSE 4000; fixed `data-source.ts` migrations path from `'src/migrations/*.ts'` to `__dirname + '/migrations/*.ts'` + `.js` for prod compatibility
- [x] Add `migration:run:prod` + `migration:revert:prod` to root `package.json` (used by `docker compose exec`) and `apps/api/package.json` (local use)
- [x] Stripe initialization already conditional — `SubscriptionsService` already has `this.stripe = key ? new Stripe(key) : null` and null guards; no changes needed
- [x] Create `.github/workflows/cd.yml` — SSH deploy via `appleboy/ssh-action@v1.2.0` on push to main
- [x] NestJS prefix is `api/v1`; Traefik does NOT strip `/api` — full path forwarded unchanged. `NEXT_PUBLIC_API_URL` hardcoded to `https://autoguildx.com/api/v1` in docker-compose.server.yml build args

### Ops ✅ COMPLETE

- [x] SSH in: `ssh -p 222 root@84.247.140.175`
- [x] Repo already cloned at `/opt/autoguildx`; `.env.production` already present
- [x] `DEPLOY_SSH_KEY` added to GitHub repo secrets (key at `/root/.ssh/deploy_key` on server)
- [x] First-time deploy completed — containers running: `autoguildx-web-1`, `autoguildx-api-1`, `autoguildx-db-1`
- [x] Migrations ran successfully
- [x] Verified: `curl -sk https://autoguildx.com/api/v1/health` → `{"status":"ok"}`; web returns HTTP 200

### CI/CD fixes applied during Sprint 23 ops
- [x] `npm ci` → `npm install --prefer-offline` in CI workflow and API Dockerfile (fsevents macOS-only dep absent from Linux lock file)
- [x] Prettier formatting fixed in `admin.controller.ts`, `admin.service.ts`, `auth.service.ts`, `migrations/1700000000013-AddForums.ts`, `apps/web/src/app/page.tsx`
- [x] CD `command_timeout` increased to `30m` (Docker build exceeds default 10m)
- [x] `eslint.ignoreDuringBuilds: true` added to `next.config.mjs` — ESLint already runs in CI; skipped in Docker to avoid TypeScript peer-dep resolution issue in monorepo build context

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
