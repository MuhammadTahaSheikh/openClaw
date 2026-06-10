# Deploy OpenClaw Backend to Hostinger VPS

Target server: `root@187.124.52.234`

You already have **3 other projects** on this VPS. OpenClaw is deployed **in isolation**:

| What | OpenClaw uses | Your other projects |
|------|---------------|---------------------|
| Folder | `/var/www/openclaw/` only | untouched |
| PM2 name | `openclaw-backend` only | untouched |
| Port | `3010` by default (not 3000) | unchanged |
| Nginx | new file `openclaw-api` + subdomain | existing sites unchanged |

### Check what's already running

```bash
./deploy/inspect-vps.sh root@187.124.52.234
```

Pick a free port if `3010` is taken:

```bash
APP_PORT=3011 ./deploy/deploy-backend.sh root@187.124.52.234
```

## 1. Allow VPS to reach MySQL

In **Hostinger hPanel → Databases → Remote MySQL**, add:

```
187.124.52.234
```

Without this, the backend on the VPS cannot connect to `srv1535.hstgr.io`.

## 2. Configure production environment

```bash
cp deploy/backend/.env.production.example deploy/backend/.env.production
```

Edit `deploy/backend/.env.production`:

- Strong `JWT_SECRET` (64+ random characters)
- Strong `ADMIN_PASSWORD`
- `FRONTEND_URL` = your live frontend URL
- Confirm DB credentials

## 3. SSH access

From your Mac, either:

**Option A — SSH key (recommended)**

```bash
ssh-copy-id root@187.124.52.234
```

**Option B — password**

You will be prompted when running deploy commands.

Test:

```bash
ssh root@187.124.52.234 "echo ok"
```

## 4. Deploy (automated)

From the project root:

```bash
./deploy/deploy-backend.sh root@187.124.52.234
```

This will:

- rsync backend code to `/var/www/openclaw/backend`
- install Node.js 20, PM2, nginx (if missing)
- `npm ci`, `npm run build`
- start/restart via PM2

## 5. Nginx (public HTTP)

SSH into the server:

```bash
ssh root@187.124.52.234
```

Copy nginx config (from your machine):

```bash
scp deploy/backend/nginx.conf root@187.124.52.234:/etc/nginx/sites-available/openclaw-api
```

On the server:

```bash
ln -sf /etc/nginx/sites-available/openclaw-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Update `server_name` in the nginx file to your domain (e.g. `api.bestechvision.com`) or use the VPS IP.

## 6. Firewall

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

## 7. SSL (optional, with a domain)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.bestechvision.com
```

## 8. Verify

```bash
curl http://187.124.52.234/health
# or
curl https://api.bestechvision.com/health
```

Expected: `{"status":"ok","service":"openclaw-backend"}`

## 9. Point frontend at the API

When building the frontend for production:

```bash
VITE_API_URL=https://api.bestechvision.com npm run build
```

## Useful commands on VPS

```bash
pm2 status
pm2 logs openclaw-backend
pm2 restart openclaw-backend
```

## Redeploy after code changes

```bash
./deploy/deploy-backend.sh root@187.124.52.234
```
