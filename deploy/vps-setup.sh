#!/usr/bin/env bash
# Run this ON THE VPS (you are already SSH'd in as root).
# Usage: bash vps-setup.sh
set -euo pipefail

APP_DIR="/var/www/openclaw-backend"
APP_PORT="3010"
REPO="https://github.com/MuhammadTahaSheikh/openClaw.git"

echo "==> Installing into $APP_DIR on port $APP_PORT"

if [[ ! -f "$APP_DIR/backend/.env" ]] && [[ ! -f "$APP_DIR/.env" ]]; then
  echo ""
  echo "ERROR: Create $APP_DIR/.env first (see below), then run this script again."
  echo ""
  exit 1
fi

if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO" "$APP_DIR"
fi

cd "$APP_DIR/backend"

# Support .env in backend/ or parent
if [[ -f "$APP_DIR/.env" ]] && [[ ! -f .env ]]; then
  cp "$APP_DIR/.env" .env
fi

if grep -q '^PORT=' .env; then
  sed -i "s/^PORT=.*/PORT=$APP_PORT/" .env
else
  echo "PORT=$APP_PORT" >> .env
fi

npm ci --omit=dev
# dist/ must be present (build on your Mac: cd backend && npm run build, then rsync dist/)
if [[ ! -f dist/index.js ]]; then
  echo "ERROR: dist/index.js missing. Build locally and upload dist/, or run: npm ci && npm run build"
  exit 1
fi

cat > /var/www/openclaw-backend/ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: "openclaw-backend",
    cwd: "$APP_DIR/backend",
    script: "dist/index.js",
    instances: 1,
    autorestart: true,
    max_memory_restart: "300M",
    env: { NODE_ENV: "production" },
  }],
};
EOF

pm2 startOrReload /var/www/openclaw-backend/ecosystem.config.cjs --update-env
pm2 save

sleep 2
curl -sf "http://127.0.0.1:$APP_PORT/health" && echo ""
echo "Done. Add nginx block to vps-apis.conf, then: nginx -t && systemctl reload nginx"
