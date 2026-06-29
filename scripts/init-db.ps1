param(
  [string]$DatabaseUrl = "postgresql://postgres:postgres@localhost:5432/erp?schema=public"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"

Write-Host "==> Generating Prisma client..."
Push-Location $backend
try {
  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created backend/.env from .env.example"
  }

  $env:DATABASE_URL = $DatabaseUrl
  Write-Host "==> Verifying migration scripts..."
  & (Join-Path $root "scripts/verify-migrations.ps1")
  npx prisma generate
  Write-Host "==> Applying migrations..."
  npx prisma migrate deploy
  Write-Host "==> Seeding database..."
  npx prisma db seed
  Write-Host "Done. Admin username: admin (password from SEED_ADMIN_PASSWORD in backend/.env)"
}
finally {
  Pop-Location
}
