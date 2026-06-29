#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG="$ROOT/backend/prisma/migrations"

if [[ ! -f "$MIG/migration_lock.toml" ]]; then
  echo "缺少 migration_lock.toml" >&2
  exit 1
fi

missing=()
count=0
for dir in "$MIG"/*/; do
  [[ -d "$dir" ]] || continue
  count=$((count + 1))
  sql="${dir}migration.sql"
  if [[ ! -s "$sql" ]]; then
    missing+=("$(basename "$dir")")
  fi
done

if [[ $count -eq 0 ]]; then
  echo "未发现任何迁移目录" >&2
  exit 1
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "以下迁移缺少有效 migration.sql:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "OK: $count 个迁移目录均包含 migration.sql"
