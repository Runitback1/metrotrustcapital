#!/usr/bin/env bash
set -euo pipefail

# Create a reusable starter copy of the current app without build artifacts,
# dependencies, local git metadata, or env files.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${1:-${APP_DIR}/../metrotrust-app-skeleton}"

mkdir -p "${OUTPUT_DIR}"

rsync -a --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "build" \
  --exclude ".env" \
  --exclude ".env.*" \
  --exclude "src.zip" \
  --exclude ".DS_Store" \
  "${APP_DIR}/" "${OUTPUT_DIR}/"

if [[ -f "${APP_DIR}/.env" ]]; then
  awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1"="}' "${APP_DIR}/.env" > "${OUTPUT_DIR}/.env.example"
elif [[ -f "${APP_DIR}/.env.production" ]]; then
  awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1"="}' "${APP_DIR}/.env.production" > "${OUTPUT_DIR}/.env.example"
fi

echo "Skeleton ready at: ${OUTPUT_DIR}"
echo "Next: cd ${OUTPUT_DIR} && npm install && npm run build"
