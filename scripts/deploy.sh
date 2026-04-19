#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/wwt-be"
BRANCH="main"
PROCESS_NAME="wwt-be"
DEPLOY_DIR="$APP_DIR/.deploy"
LAST_SUCCESSFUL_FILE="$DEPLOY_DIR/last_successful_commit"
PREVIOUS_SUCCESSFUL_FILE="$DEPLOY_DIR/previous_successful_commit"

mkdir -p "$DEPLOY_DIR"

PRE_DEPLOY_COMMIT="$(git -C "$APP_DIR" rev-parse HEAD)"
ROLLBACK_DONE=0

rollback() {
  if [[ "$ROLLBACK_DONE" -eq 1 ]]; then
    return
  fi

  ROLLBACK_DONE=1

  echo "[deploy] deployment failed, rolling back to $PRE_DEPLOY_COMMIT"
  cd "$APP_DIR"
  git reset --hard "$PRE_DEPLOY_COMMIT"
  pnpm install --frozen-lockfile
  pnpm build
  pm2 restart "$PROCESS_NAME"
  pm2 save
  echo "[deploy] rollback complete"
}

trap rollback ERR

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

CURRENT_COMMIT="$(git rev-parse HEAD)"

if [[ -f "$LAST_SUCCESSFUL_FILE" ]]; then
  cp "$LAST_SUCCESSFUL_FILE" "$PREVIOUS_SUCCESSFUL_FILE"
fi

echo "$CURRENT_COMMIT" > "$LAST_SUCCESSFUL_FILE"

echo "[deploy] done"
