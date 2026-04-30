# AutoGuildX — Product Requirements Document

## Vision

AutoGuildX is a web-based platform combining a professional identity layer, content-driven community, and curated marketplace for specialized automotive experts, builders, and collectors in the United States.

**Core value proposition:** "Built for those who build cars."

## Problem Statement

- Small manufacturers lack visibility and distribution
- Specialized mechanics operate in isolated networks
- Collectors struggle to find trusted parts and services
- Existing platforms are too generic, unstructured, or outdated

There is no centralized, trusted, professional ecosystem for this niche.

## Target Users

| Segment | Who |
|---|---|
| Mechanics / Shops | Restoration specialists, performance tuners, niche experts |
| Manufacturers | Small-scale parts producers, custom fabrication shops |
| Collectors / Enthusiasts | Owners of rare/classic/performance vehicles, DIY builders |

---

## Built Feature Scope

All features below are fully implemented and deployed unless noted.

### 1. User Authentication & Onboarding
- Email/password registration + Google OAuth via Firebase
- 3-step onboarding: role picker → profile details → specialty tags
- Role selection removed from signup — happens in onboarding for better UX
- Role types: `mechanic` | `manufacturer` | `collector` | `enthusiast`

### 2. Profiles
- Name, bio, location, specialization tags, role type badge
- Profile image upload (camera overlay → presign → S3)
- Profile video avatar (MP4/WebM — renders as looping avatar)
- Follow / unfollow with live follower/following counts
- Portfolio represented through the feed posts list on profile
- Inline edit form: name, bio, location, role type picker, tag editing (Sprint 9)
- Public profile page (`/profile/[id]`) with follow, message, reviews, posts

### 3. Social Feed
- Create posts with text, up to 9 images, media mode (single / grid / carousel)
- Post visibility: public / followers-only / private
- Emoji reactions: 🔥 fire · ❤️ love · 🔧 respect · 😮 wild · 👍 like (hover-reveal picker)
- Comments with inline thread (expand/collapse)
- Share / repost: quick share or share with comment (modal)
- Automatic YouTube link detection → thumbnail preview card
- Generic URL link preview card
- Text linkification (URLs become clickable links)
- 1-link-per-post rule enforced at compose time
- Inline shared listing/event preview cards (deep-linked)
- Feed scoped to followed users when authenticated; falls back to public
- Infinite scroll with load-more

### 4. Marketplace Listings
- List parts or services: title, description, price, category, vehicle tags, location, up to 5 images
- Browse with type filter (All / Parts / Services), keyword search, infinite scroll
- Star rating badge (avg + count) on listing cards
- Contact seller: in-app message conversation or email fallback
- Featured listing boost (7-day campaign) with tier enforcement
- Share listing to feed with snapshot preview card
- Copy-link share button

### 5. Search & Discovery
- Full-text ILike search across profiles, listings, and events
- Section filter: All / People / Listings / Events
- Star ratings shown on search result cards
- Location and vehicle tag filters — Sprint 9

### 6. Events
- Create events: title, type (meetup / workshop / show / race), description, location, start/end datetime
- Browse upcoming events (infinite scroll, date blocks, type badges)
- RSVP with optimistic count update
- Share event to feed with snapshot preview card
- Copy-link share button

### 7. Direct Messaging
- Conversation-based 1:1 messaging
- Start conversation from listing detail or profile page ("Message Seller" / "Message")
- Unread message badge on Messages nav item (polls every 10 s)
- Conversation list with last message preview and unread count per conversation

### 8. Notifications
- In-app notifications for: follows, reactions, comments, shares, reviews
- Notification bell in header with unread badge (polls every 15 s)
- Slide-down notification panel with read/unread state and deep links
- Dedicated `/notifications` page

### 9. Reviews & Ratings
- 5-star overall rating + 4 dimension ratings (quality / communication / timeliness / value)
- One review per reviewer–target pair (upsert)
- Distribution histogram, average, and per-dimension scores
- `ReviewSection` component wired into `/profile/[id]` and `/marketplace/[id]`
- Lightweight summary (avg + total) shown on listing cards and search results

### 10. Subscription Tiers

| Tier | Price | Listings | Featured Campaigns |
|---|---|---|---|
| Free | $0 | 5 | 0 |
| Owner | $9.99/month | 15 | 1 |
| Company | $99.99/month | Unlimited | 5 |

- Limits enforced server-side in `ListingsService` (throws 403 with message on breach)
- Tier badge in AppShell header and sidebar
- `UpgradeModal` with tier cards, pricing, and Stripe Checkout redirect
- Stripe Checkout session creation fully implemented (`POST /subscriptions/create-checkout-session`)
- Stripe webhook handler for `checkout.session.completed` and `customer.subscription.deleted`
- Success (`/subscription/success`) and cancel (`/subscription/cancel`) result pages
- **Activation requirement:** Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_OWNER`, `STRIPE_PRICE_COMPANY`, `STRIPE_WEBHOOK_SECRET` env vars + register webhook in Stripe dashboard

### 11. Media Uploads
- `UploadService` with S3 presign stub (swap for real credentials when ready)
- `POST /upload/presign` → browser PUTs directly to S3 → stores public URL
- Used by: profile image, profile video, post images, listing images

---

## Success Metrics (MVP)

- 300–500 registered users
- 100+ active profiles
- 200+ listings
- Weekly active engagement (posts, likes, comments, reactions)
- First paid subscriptions via Stripe

## Go-To-Market Strategy

**Phase 1 — Seed Community:** Onboard early adopters in key niches (mechanics, manufacturers). Target via niche forums, communities, and direct outreach.

**Phase 2 — Content-Led Growth:** Technical content, build showcases, educational posts to drive organic discovery.

**Phase 3 — Expansion:** Partnerships with niche communities, presence at industry events (e.g., SEMA).

---

## Remaining Work (Sprint 9)

| Item | Status |
|---|---|
| Profile edit — specialty tag editing | Pending |
| Subscription cancel/downgrade UI | Pending |
| Discover — location + vehicle tag filters | Pending |
| Stripe production env vars + webhook registration | Ops (no code changes) |
| Real S3 credentials for media uploads | Ops (no code changes) |

---

## Post-MVP Roadmap

- Verified badges (identity trust layer)
- Payment transaction fees (up to 9% on marketplace sales)
- Logistics / shipping support
- Courses and certifications
- Advanced discovery and matching (AI-based recommendations)
- Mobile app (React Native)

---

## Key Risks

- Low initial supply of listings and profiles
- Users remain in existing generic platforms (Instagram, eBay, Facebook Marketplace)
- Trust gap without verified badges
- Stripe and S3 not yet activated in production (code complete, needs env vars)
