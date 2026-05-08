#!/usr/bin/env bash
# First-time SSL certificate setup using Let's Encrypt + Certbot.
# Run once on a fresh server after DNS is pointing to this machine.
#
# Usage:
#   export DOMAIN_NAME=autoguildx.com
#   export EMAIL=admin@autoguildx.com
#   bash scripts/init-letsencrypt.sh

set -euo pipefail

: "${DOMAIN_NAME:?Set DOMAIN_NAME before running this script}"
: "${EMAIL:?Set EMAIL before running this script}"

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"

echo "▸ Creating temporary self-signed cert so nginx can start..."
mkdir -p ./certbot/conf/live/"$DOMAIN_NAME"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout ./certbot/conf/live/"$DOMAIN_NAME"/privkey.pem \
  -out    ./certbot/conf/live/"$DOMAIN_NAME"/fullchain.pem \
  -subj "/CN=localhost" 2>/dev/null
echo "  done."

echo "▸ Starting nginx (HTTP only, to serve ACME challenge)..."
$COMPOSE up -d nginx
sleep 3

echo "▸ Removing dummy cert..."
rm -rf ./certbot/conf/live

echo "▸ Requesting Let's Encrypt certificate for $DOMAIN_NAME..."
$COMPOSE run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN_NAME" \
  -d "www.$DOMAIN_NAME"

echo "▸ Reloading nginx with real certificate..."
$COMPOSE exec nginx nginx -s reload

echo ""
echo "✓ SSL certificate issued for $DOMAIN_NAME"
echo "  Auto-renewal runs every 12h inside the certbot container."
