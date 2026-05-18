---
name: Sprint 23 Server Deployment Context
description: Full briefing for deploying AutoGuildX to Contabo VPS with Traefik v2.11. Server details, network topology, critical gotchas, and all pending code/ops tasks.
type: project
---

Sprint 23 is the next session's work: deploy AutoGuildX to the shared Contabo VPS.

**Why:** The app is code-complete and production-dockerized (Sprint 22). The actual server uses Traefik (not nginx) because it's shared with Noetia, so a new `docker-compose.server.yml` is needed.

**How to apply:** Next session starts here. Do code changes first, then ops.

---

## Server facts

| Property | Value |
|---|---|
| Provider | Contabo Cloud VPS 30 SSD |
| IP | 84.247.140.175 |
| OS | Ubuntu 24.04 LTS |
| SSH | `ssh root@84.247.140.175` |
| App dir | `/opt/autoguildx/` |
| Specs | 8 vCPU · 24 GB RAM · 400 GB SSD |

- Already installed: Docker, Docker Compose plugin, UFW (22/80/443 open), fail2ban, git
- Traefik v2.11 runs at `/opt/traefik/`, owns ports 80/443, handles SSL via Let's Encrypt
- Shared Docker network `proxy` already exists
- **Do NOT touch** `/opt/traefik/` or `/opt/noetia/`

## DNS (already live in Cloudflare)

- `autoguildx.com` → A → `84.247.140.175` (gray / DNS only)
- `www.autoguildx.com` → A → `84.247.140.175` (gray / DNS only)
- Keep gray — do NOT orange-cloud. Traefik handles SSL; Cloudflare proxy breaks it.

---

## Code changes needed (repo work)

1. **Create `docker-compose.server.yml`** at repo root — standalone, no nginx/certbot. Two Docker networks: `agx_net` (internal bridge) and `proxy` (external, shared Traefik network). Services: `web` (port 3000), `api` (port 4000), `db` (PostgreSQL 16, internal only, healthcheck). Traefik labels on web and api. Full spec is in CLAUDE.md.

2. **Update `apps/web/Dockerfile` build stage** — add these ENV lines before `npm run build`:
   ```
   ENV NEXT_PUBLIC_API_URL=https://autoguildx.com/api
   ENV NEXT_PUBLIC_OAUTH_URL=https://autoguildx.com/api
   ENV INTERNAL_API_URL=http://api:4000
   ENV NEXT_TELEMETRY_DISABLED=1
   ```
   NEXT_PUBLIC_* vars are baked at compile time, not injectable at runtime.

3. **Update `apps/api/Dockerfile`** — verify `dist/data-source.js` is included in the production build (needed for `migration:run:prod`). The TypeORM DataSource file must be compiled into dist.

4. **Add to `apps/api/package.json` scripts:**
   ```json
   "migration:run:prod": "node node_modules/typeorm/cli.js migration:run -d dist/data-source.js",
   "migration:revert:prod": "node node_modules/typeorm/cli.js migration:revert -d dist/data-source.js"
   ```

5. **Make Stripe conditional** in `SubscriptionsService` and webhooks controller — the Stripe SDK throws at startup if `STRIPE_SECRET_KEY` is empty, crashing the API. Pattern:
   ```ts
   const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
   this.stripe = stripeKey ? new Stripe(stripeKey) : null;
   
   private requireStripe(): Stripe {
     if (!this.stripe) throw new BadRequestException({ error: 'payments_not_configured' });
     return this.stripe;
   }
   // Replace all this.stripe.xxx with this.requireStripe().xxx
   ```

6. **Create `.github/workflows/cd.yml`** — SSH deploy on push to main via `appleboy/ssh-action@v1.2.0`. Script: `git pull` → `docker compose --env-file .env.production -f docker-compose.server.yml up -d --build --remove-orphans` → `exec -T api npm run migration:run:prod` → `docker image prune -f`. Requires `DEPLOY_SSH_KEY` GitHub secret.

7. **Verify NestJS global prefix** in `apps/api/src/main.ts` — Traefik strips `/api` before forwarding. If NestJS global prefix is `api/v1`, routes won't resolve (NestJS gets `/v1/...` but expects `/api/v1/...`). Fix: change prefix to `v1`.

---

## Ops tasks (done on server, not code)

1. SSH in: `ssh root@84.247.140.175`
2. Clone: `git clone <repo-url> /opt/autoguildx`
3. Create `/opt/autoguildx/.env.production` (never commit). Generate secrets with `openssl rand -base64 32`. Key vars:
   - `DB_NAME=autoguildx`, `DB_USER=autoguildx`, `DB_PASS=<random>`, `DB_HOST=db`
   - `WEB_URL=https://autoguildx.com`, `API_URL=https://autoguildx.com`
   - `JWT_SECRET=<random>`, `JWT_EXPIRES_IN=15m`
   - Firebase Admin SDK vars
   - `RESEND_API_KEY`, `EMAIL_FROM=AutoGuildX <noreply@autoguildx.com>`
   - Stripe vars (optional — app degrades if absent after Stripe-conditional fix)
   - AWS S3 vars
4. Add `DEPLOY_SSH_KEY` to GitHub repo secrets: `ssh root@84.247.140.175 'cat /root/.ssh/deploy_key'`
5. First deploy: `docker compose --env-file .env.production -f docker-compose.server.yml up -d --build`
6. Run migrations: `docker compose --env-file .env.production -f docker-compose.server.yml exec -T api npm run migration:run:prod`

---

## Critical gotchas (learned from Noetia deployment)

- **Always pass `--env-file .env.production`** — Docker only auto-loads `.env` (literal filename), not `.env.production`
- **Use Traefik v2.11 not v3** — v3 has a Docker API version negotiation bug on this server's daemon
- **Paste multi-line env values via heredoc**, not nano: `cat >> .env.production << 'EOF' ... EOF`
- **`docker compose exec` needs `-T`** for non-interactive/CI use; without it, hangs without TTY
- **`docker compose exec` does NOT re-read `--env-file`** for the running container — restart container to pick up new env vars, or pass `-e KEY=value`
- **`DB_HOST=db` must be explicitly set** — if missing, any script bootstrapping NestJS will try localhost and get ECONNREFUSED (even though the main app container works because it defaults to `db`)
- **CORS must match exactly** — `https://autoguildx.com` in NestJS `main.ts` CORS origin
- **Socket.IO needs its own Traefik router** (separate from `/api`) — already in the compose spec above
- **API port is 4000** in the Traefik labels (`server.port=4000`); dev is 3001
