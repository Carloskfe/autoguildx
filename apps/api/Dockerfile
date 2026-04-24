# Build context: monorepo root
FROM node:24-alpine AS builder
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared types then API
RUN npm run build --workspace=packages/shared && \
    npm run build --workspace=apps/api

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Preserve monorepo structure so @autoguildx/shared symlink resolves
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
