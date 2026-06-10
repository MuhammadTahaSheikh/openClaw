#!/usr/bin/env bash
# Show what's already on the VPS (ports, PM2, nginx) before deploying.
# Usage: ./deploy/inspect-vps.sh root@187.124.52.234

SSH_TARGET="${1:-root@187.124.52.234}"

ssh "$SSH_TARGET" bash -s <<'REMOTE'
echo "=== PM2 processes ==="
pm2 list 2>/dev/null || echo "(pm2 not installed)"

echo ""
echo "=== Nginx sites ==="
ls -1 /etc/nginx/sites-enabled/ 2>/dev/null || echo "(nginx not configured)"

echo ""
echo "=== /var/www ==="
ls -la /var/www/ 2>/dev/null || echo "(no /var/www)"

echo ""
echo "=== Listening ports (node/nginx) ==="
ss -tlnp 2>/dev/null | grep -E ':(80|443|300[0-9]|301[0-9]) ' || ss -tlnp 2>/dev/null | head -15
REMOTE
