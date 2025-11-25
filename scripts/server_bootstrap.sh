#!/usr/bin/env bash
set -euo pipefail

# Usage: run on the server as root
# curl -fsSL https://raw.githubusercontent.com/<your-repo>/scripts/server_bootstrap.sh | bash

APP_DIR=${APP_DIR:-/srv/cepalab}
DOMAIN=${DOMAIN:-cepalab.angrax.com.br}
NODE_MAJOR=20

echo "[1/5] Updating system"
apt update && apt -y upgrade

echo "[2/5] Installing Node.js ${NODE_MAJOR}, PM2 and NGINX"
curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
apt -y install nodejs nginx
npm i -g pm2

echo "[3/5] Preparing app directory: ${APP_DIR}"
mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

if [ ! -f package.json ]; then
  echo "package.json not found in ${APP_DIR}. Please upload the app files before running build."
  exit 1
fi

echo "[4/5] Installing dependencies and building"
npm ci
NODE_OPTIONS="--max_old_space_size=2048" npm run build

echo "[5/5] Starting app with PM2"
pm2 start npm --name cepalab -- start
pm2 save
pm2 startup systemd -u root --hp /root || true

echo "Configuring NGINX (HTTP only)"
cat > /etc/nginx/sites-available/cepalab <<'CONF'
server {
  listen 80;
  server_name cepalab.angrax.com.br;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
    client_max_body_size 20m;
  }
}
CONF

ln -sf /etc/nginx/sites-available/cepalab /etc/nginx/sites-enabled/cepalab
nginx -t && systemctl reload nginx

echo "Deployment done: http://${DOMAIN}"