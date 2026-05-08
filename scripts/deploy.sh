#!/usr/bin/env bash
# Rolling deploy — pull, rebuild changed images, restart services.
# Migrations run automatically on API startup (migrationsRun: true in production).
#
# Usage (run from project root on the server):
#   bash scripts/deploy.sh

set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

echo "▸ Pulling latest code..."
git pull origin main

echo "▸ Building images (unchanged layers are cached)..."
$COMPOSE build api web

echo "▸ Restarting API (runs DB migrations on startup)..."
$COMPOSE up -d --no-deps api

echo "▸ Waiting for API health check (up to 60s)..."
for i in $(seq 1 12); do
  if $COMPOSE exec -T api wget -qO- http://localhost:3001/api/v1/health >/dev/null 2>&1; then
    echo "  API is healthy."
    break
  fi
  echo "  waiting... ($((i * 5))s)"
  sleep 5
  if [ "$i" -eq 12 ]; then
    echo "  ERROR: API did not become healthy. Check logs: $COMPOSE logs api"
    exit 1
  fi
done

echo "▸ Restarting web..."
$COMPOSE up -d --no-deps web

echo "▸ Pruning unused images..."
docker image prune -f

echo ""
echo "✓ Deploy complete"
