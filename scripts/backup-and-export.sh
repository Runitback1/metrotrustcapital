#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_ROOT="${APP_DIR}/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${BACKUP_ROOT}/${STAMP}"

mkdir -p "${OUT_DIR}"

echo "Creating project archive..."
tar -czf "${OUT_DIR}/metrotrust-app-${STAMP}.tar.gz" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='build' \
  --exclude='backups' \
  --exclude='.DS_Store' \
  -C "${APP_DIR}" .

echo "Creating git bundle..."
git -C "${APP_DIR}" bundle create "${OUT_DIR}/metrotrust-app-${STAMP}.bundle" --all

echo "Creating SQL restore snapshot from local sql/*.sql..."
mkdir -p "${OUT_DIR}/sql"
if ls "${APP_DIR}"/sql/*.sql >/dev/null 2>&1; then
  cat "${APP_DIR}"/sql/*.sql > "${OUT_DIR}/sql/local-schema-snapshot.sql"
else
  : > "${OUT_DIR}/sql/local-schema-snapshot.sql"
fi

echo "Attempting live Supabase schema export (if CLI is installed and project is linked)..."
if command -v supabase >/dev/null 2>&1; then
  set +e
  supabase db dump --schema public --file "${OUT_DIR}/sql/supabase-public-schema.sql"
  dump_exit=$?
  set -e
  if [[ $dump_exit -ne 0 ]]; then
    echo "Supabase live export skipped (CLI not linked/authenticated)."
    rm -f "${OUT_DIR}/sql/supabase-public-schema.sql"
  fi
else
  echo "Supabase CLI not found; skipped live export."
fi

echo "Backup complete: ${OUT_DIR}"
echo "Files:"
ls -1 "${OUT_DIR}"
