#!/usr/bin/env bash
set -euo pipefail

# Deploy OpenClaw backend to a VPS via SSH (alongside existing projects).
#
# Usage:
#   ./deploy/deploy-backend.sh root@187.124.52.234
#   APP_PORT=3010 ./deploy/deploy-backend.sh root@187.124.52.234
#
# Prerequisites:
#   - SSH access to the server (key or password)
#   - Production .env at deploy/backend/.env.production (gitignored)
#   - Hostinger Remote MySQL: allow the VPS IP (187.124.52.234)
#   - Pick APP_PORT that is not used by your other 3 projects (default: 3010)

SSH_TARGET="${1:-}"
APP_PORT="${APP_PORT:-3010}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/openclaw-backend}"

if [[ -z "$SSH_TARGET" ]]; then
  echo "Usage: $0 user@host"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/backend/.env.production"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Copy deploy/backend/.env.production.example and fill in production values."
  exit 1
fi

echo "==> Building TypeScript locally..."
(cd "$ROOT_DIR/backend" && npm run build)

echo "==> Syncing backend to $SSH_TARGET:$REMOTE_DIR"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .env \
  "$ROOT_DIR/backend/" "$SSH_TARGET:$REMOTE_DIR/"

echo "==> Uploading production .env"
scp "$ENV_FILE" "$SSH_TARGET:$REMOTE_DIR/.env"

echo "==> Uploading PM2 config"
scp "$ROOT_DIR/deploy/backend/ecosystem.config.cjs" "$SSH_TARGET:$REMOTE_DIR/ecosystem.config.cjs"

echo "==> Running remote setup (port $APP_PORT, dir $REMOTE_DIR)"
ssh "$SSH_TARGET" "APP_PORT=$APP_PORT REMOTE_DIR=$REMOTE_DIR" bash -s <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
APP_PORT="${APP_PORT:-3010}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/openclaw-backend}"

install_node() {
  if command -v node >/dev/null 2>&1; then
    echo "Node $(node -v) already installed"
    return
  fi
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
}

install_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 already installed"
    return
  fi
  npm install -g pm2
}

install_nginx() {
  if command -v nginx >/dev/null 2>&1; then
    echo "Nginx already installed"
    return
  fi
  apt-get update -y
  apt-get install -y nginx
}

mkdir -p "$REMOTE_DIR"
cd "$REMOTE_DIR"

install_node
install_pm2

# Ensure PORT in .env matches APP_PORT (lawyer/autofollow use 3001)
if grep -q '^PORT=' "$REMOTE_DIR/.env"; then
  sed -i "s/^PORT=.*/PORT=$APP_PORT/" "$REMOTE_DIR/.env"
else
  echo "PORT=$APP_PORT" >> "$REMOTE_DIR/.env"
fi

if ss -tlnp 2>/dev/null | grep -q ":$APP_PORT "; then
  echo "WARNING: port $APP_PORT is already in use. Set APP_PORT to a free port and redeploy."
  ss -tlnp | grep ":$APP_PORT " || true
fi

echo "Installing production dependencies..."
npm ci --omit=dev

echo "Starting with PM2..."
pm2 startOrReload "$REMOTE_DIR/ecosystem.config.cjs" --update-env
pm2 save

# Do not re-run pm2 startup if other projects already use PM2 on this VPS
if ! systemctl is-enabled pm2-root >/dev/null 2>&1; then
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
fi

install_nginx

if ! grep -q openclaw.bestechvision.com /etc/nginx/sites-enabled/vps-apis.conf 2>/dev/null; then
  echo ""
  echo "Nginx: add openclaw server block to /etc/nginx/sites-enabled/vps-apis.conf"
  echo "  proxy_pass http://127.0.0.1:$APP_PORT"
  echo "  See deploy/backend/vps-apis.snippet.conf on your Mac"
fi

echo ""
echo "Health check (local on VPS, port $APP_PORT):"
sleep 2
curl -sf "http://127.0.0.1:$APP_PORT/health" || echo "Backend not responding yet — check: pm2 logs openclaw-backend"
REMOTE

echo ""
echo "Deploy complete."
echo "  VPS health:  ssh $SSH_TARGET 'curl -s http://127.0.0.1:$APP_PORT/health'"
echo "  PM2 logs:    ssh $SSH_TARGET 'pm2 logs openclaw-backend'"
echo "  Public API:  add nginx site openclaw-api (subdomain) — see deploy/DEPLOY.md"
