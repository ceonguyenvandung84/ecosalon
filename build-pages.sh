#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> load .env.production (build-time vars)"
if [ -f .env.production ]; then
  set -a
  . ./.env.production
  set +a
fi

echo "==> opennextjs-cloudflare build"
npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion

echo "==> prepare .pages-out"
DEPLOY=".pages-out"
rm -rf "$DEPLOY"
mkdir -p "$DEPLOY"

# Copy toàn bộ .open-next
cp -r .open-next/. "$DEPLOY/"

# Copy static assets ra gốc (Pages phục vụ trực tiếp)
cp -r "$DEPLOY/assets/." "$DEPLOY/"

# Tạo Pages Functions wrapper gọi worker
mkdir -p "$DEPLOY/functions"
cat > "$DEPLOY/functions/[[path]].js" <<'EOF'
import worker from "../worker.js";
export const onRequest = async (context) => {
  return worker.fetch(context.request, context.env, context);
};
EOF

echo "==> Done. Output: $DEPLOY"
