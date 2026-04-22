# AutoGuildX — Product Requirements Document (MVP)

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

## MVP Feature Scope

### 1. User Authentication & Onboarding
- Email/password registration with role selection (mechanic, manufacturer, collector, enthusiast)
- Google OAuth via Firebase
- 2-step onboarding to complete profile after signup

### 2. Profiles
- Individual and business profile types
- Name, bio, location, specialization tags, profile image
- Portfolio represented through posts
- Follow / unfollow between users

### 3. Social Feed
- Create posts with text and media
- Like posts
- Paginated feed of followed users' posts

### 4. Marketplace Listings
- List parts or services with title, description, price, category, vehicle tags, location, media
- Browse and filter by type, category, location
- Contact seller (no in-platform payment — direct contact only)
- Featured listing boost for paid visibility

### 5. Search & Discovery
- Full-text search across profiles, listings, and events
- Filter by location, vehicle type, service type

### 6. Events
- Create events with type (meetup, workshop, show, race)
- Browse upcoming events
- RSVP system

### 7. Subscription Tiers

| Tier | Price | Listings | Featured Campaigns |
|---|---|---|---|
| Free | $0 | 5 | 0 |
| Owner | $9.99/month | 15 | 1 |
| Company | $99.99/month | Unlimited | 5 |

Featured listing boosts: $5–$20 per boost, increases exposure in marketplace and feed.

Business logic constants live in `packages/shared/src/types/subscription.ts`.

> **MVP constraint:** Subscription tier changes are recorded in the database but no payment gateway is wired. Payment processing is post-MVP.

## Non-Goals (MVP)

- In-platform payment processing or transaction fees
- Shipping / logistics support
- Direct messaging system
- Reviews and ratings
- Verified badges
- AI-based recommendations
- Courses and certifications

## Success Metrics (MVP)

- 300–500 registered users
- 100+ active profiles
- 200+ listings
- Weekly active engagement (posts, likes, comments)
- First paid subscriptions

## Go-To-Market Strategy

**Phase 1 — Seed Community:** Onboard early adopters in key niches (mechanics, manufacturers). Target via niche forums, communities, and direct outreach.

**Phase 2 — Content-Led Growth:** Technical content, build showcases, educational posts to drive organic discovery.

**Phase 3 — Expansion:** Partnerships with niche communities, presence at industry events (e.g., SEMA).

## Post-MVP Roadmap

- Direct messaging system
- Reviews and ratings
- Verified badges
- Payment integration and transaction fees (up to 9%)
- Logistics support
- Courses and certifications
- Advanced discovery and matching (AI-based)

## Key Risks

- Low initial supply of listings and profiles
- Users remain in existing generic platforms (Instagram, eBay, Facebook Marketplace)
- Trust and quality concerns without reviews/verification
