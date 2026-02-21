# Wix and Wax — Deployment Notes

## AWS Infrastructure (ap-south-1 / Mumbai)

| Resource | Value |
|---|---|
| EC2 Instance | `i-079cdb7ec74b87f23` |
| EC2 Public IP | `13.233.190.247` |
| EC2 Type | t3.micro, Ubuntu 22.04 |
| RDS Identifier | `wix-and-wax-db` |
| RDS Endpoint | `wix-and-wax-db.cpaao8eykg3n.ap-south-1.rds.amazonaws.com` |
| RDS Type | db.t3.micro, MySQL 8.0 |
| DB Name | `wix_and_wax` |
| DB User | `waxadmin` |
| EC2 Security Group | `sg-08550fe2b125dc574` (ports 22, 80, 443) |
| RDS Security Group | `sg-0dbfb5ff1fc5b6828` (port 3306 from EC2 SG only) |
| VPC | `vpc-0ce3930c90b9d2d77` (default) |
| SSH Key | `~/.ssh/portfolio-parser-key.pem` |

## Architecture

```
Internet → Nginx (EC2, port 80/443)
              ├── /api/*     → proxy → Docker container :3001
              ├── /uploads/* → proxy → Docker container :3001
              └── /*         → static files /var/www/wix-and-wax/client/dist/

Docker container (Express :3001) → RDS MySQL (private, port 3306)
```

## What Has Been Done

### 1. AWS Infrastructure
- [x] EC2 t3.micro launched (Ubuntu 22.04, 20GB gp3)
- [x] RDS MySQL 8.0 t3.micro created (private, no public access)
- [x] Security groups configured (RDS only accessible from EC2)
- [x] RDS subnet group across all 3 AZs

### 2. EC2 Setup
- [x] Docker + docker-compose-plugin installed
- [x] Nginx installed and enabled
- [x] Certbot + python3-certbot-nginx installed
- [x] Node.js 20 installed
- [x] Repo cloned at `/app/wix-and-wax` (with `--recurse-submodules`)

### 3. Database
- [x] Prisma schema pushed to RDS (`prisma db push`)
- [x] All tables created in `wix_and_wax` database

### 4. Frontend
- [x] Client built with `vite build` (TS errors skipped)
- [x] Static files deployed to `/var/www/wix-and-wax/client/dist/`

### 5. Config Files Created (local repo)
- [x] `Dockerfile` — multi-stage build (core-builder → server-builder → production)
- [x] `docker-compose.yml` — Express container with uploads bind-mount
- [x] `.dockerignore`
- [x] `nginx/wix-and-wax.conf`

## What Still Needs to Be Done

### 6. Docker Image — Build Locally, Push to EC2
```bash
# Build locally
docker build -t wix-and-wax-backend .

# Transfer to EC2 (no registry needed)
docker save wix-and-wax-backend | gzip | \
  ssh -i ~/.ssh/portfolio-parser-key.pem ubuntu@13.233.190.247 \
  "gunzip | docker load"
```

### 7. Start Backend Container
```bash
# On EC2
cd /app/wix-and-wax
docker compose up -d
docker compose logs -f   # verify it started
curl http://localhost:3001/api/health
```

### 8. Configure Nginx
```bash
# Copy config
scp -i ~/.ssh/portfolio-parser-key.pem \
  nginx/wix-and-wax.conf \
  ubuntu@13.233.190.247:/etc/nginx/sites-available/wix-and-wax

# On EC2
sudo ln -sf /etc/nginx/sites-available/wix-and-wax /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 9. SSL Certificate (needs domain pointed to EC2 IP first)
```bash
# Point DNS A record: yourdomain.com → 13.233.190.247
# Then on EC2:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 10. Update .env.production for Domain
After SSL, update these in `/app/wix-and-wax/server/.env.production`:
```
FRONTEND_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
PHONEPE_CALLBACK_URL=https://yourdomain.com/api/payments/phonepe/callback
PHONEPE_REDIRECT_URL=https://yourdomain.com/payment/status
```
Then `docker compose restart`.

## Environment Variables on EC2

File: `/app/wix-and-wax/server/.env.production`

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Points to RDS endpoint |
| `JWT_SECRET` | Generated — do not change after deploy |
| `GOOGLE_CLIENT_ID/SECRET` | From `.env` — update callback URL in Google Console |
| `RAZORPAY_KEY_ID/SECRET` | **Replace with real keys before going live** |
| `FRONTEND_URL` | Currently EC2 IP — update to domain after SSL |

## Useful Commands

```bash
# SSH into EC2
ssh -i ~/.ssh/portfolio-parser-key.pem ubuntu@13.233.190.247

# View backend logs
ssh ... "cd /app/wix-and-wax && sudo docker compose logs -f"

# Restart backend
ssh ... "cd /app/wix-and-wax && sudo docker compose restart"

# Rebuild and redeploy (after code changes)
docker build -t wix-and-wax-backend . && \
docker save wix-and-wax-backend | gzip | \
  ssh -i ~/.ssh/portfolio-parser-key.pem ubuntu@13.233.190.247 \
  "gunzip | docker load && cd /app/wix-and-wax && sudo docker compose up -d"
```

## Known Issues / Notes

- `server/prisma/` was never committed to git — Dockerfile uses `core/prisma/schema.prisma` for `prisma generate`
- Client build uses `vite build` directly (skipping `tsc`) due to TS errors in `Checkout.tsx`, `Cart.tsx`, `Orders.tsx`, `admin/Products.tsx` — fix these to restore type checking
- Google OAuth callback URL needs updating in Google Cloud Console once domain is set
