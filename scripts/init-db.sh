#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/erp?schema=public}"

cd "$BACKEND"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created backend/.env from .env.example"
fi

export DATABASE_URL

echo "==> Verifying migration scripts..."
bash "$ROOT/scripts/verify-migrations.sh"

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Applying migrations..."
npx prisma migrate deploy

echo "==> Seeding database..."
npx prisma db seed

echo "Done. Admin username: admin (password from SEED_ADMIN_PASSWORD in backend/.env)"
