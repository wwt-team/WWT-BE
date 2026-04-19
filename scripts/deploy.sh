#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/wwt-be"
BRANCH="main"
PROCESS_NAME="wwt-be"

echo "[deploy] move to application directory"
cd "$APP_DIR"

echo "[deploy] pull latest code"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[deploy] install dependencies"
pnpm install --frozen-lockfile

echo "[deploy] build application"
pnpm build

echo "[deploy] restart pm2 process"
pm2 restart "$PROCESS_NAME"
pm2 save

echo "[deploy] done"
