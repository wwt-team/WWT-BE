#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/wwt-be"
PROCESS_NAME="wwt-be"
DEPLOY_DIR="$APP_DIR/.deploy"
LAST_SUCCESSFUL_FILE="$DEPLOY_DIR/last_successful_commit"
PREVIOUS_SUCCESSFUL_FILE="$DEPLOY_DIR/previous_successful_commit"
TARGET_COMMIT="${1:-}"

cd "$APP_DIR"

if [[ -z "$TARGET_COMMIT" ]]; then
  if [[ -f "$PREVIOUS_SUCCESSFUL_FILE" ]]; then
    TARGET_COMMIT="$(cat "$PREVIOUS_SUCCESSFUL_FILE")"
  elif [[ -f "$LAST_SUCCESSFUL_FILE" ]]; then
    TARGET_COMMIT="$(cat "$LAST_SUCCESSFUL_FILE")"
  else
    echo "[rollback] no recorded deployment commit found"
    exit 1
  fi
fi

echo "[rollback] target commit: $TARGET_COMMIT"
git fetch origin
git reset --hard "$TARGET_COMMIT"
pnpm install --frozen-lockfile
pnpm build
pm2 restart "$PROCESS_NAME"
pm2 save
echo "$TARGET_COMMIT" > "$LAST_SUCCESSFUL_FILE"
echo "[rollback] done"
