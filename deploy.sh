#!/bin/bash
set -e

EC2="ubuntu@13.233.190.247"
SSH_KEY="~/.ssh/portfolio-parser-key.pem"
SSH="ssh -i $SSH_KEY"

echo "==> Pulling latest code + submodules on server..."
$SSH $EC2 "cd /app/wix-and-wax && git fetch origin && git reset --hard origin/main && git submodule update --init --force core && cd core && git fetch origin && git reset --hard origin/main && cd .."

echo "==> Building Docker image on server..."
$SSH $EC2 "cd /app/wix-and-wax && docker build -t wix-and-wax-backend:latest ."

echo "==> Restarting container..."
$SSH $EC2 "cd /app/wix-and-wax && docker compose up -d --force-recreate"

echo "==> Running prisma db push..."
$SSH $EC2 "docker exec wix-and-wax-backend sh -c 'cd server && npx prisma db push'"

echo "==> Building frontend..."
cd client && npm run build && cd ..

echo "==> Deploying frontend..."
rsync -av --delete -e "ssh -i $SSH_KEY" \
  client/dist/ $EC2:/tmp/dist/
$SSH $EC2 "sudo rsync -av --delete /tmp/dist/ /var/www/wix-and-wax/client/dist/"

echo "==> Smoke test..."
$SSH $EC2 "curl -s http://localhost:3001/api/health"

echo ""
echo "✓ Deploy complete"
