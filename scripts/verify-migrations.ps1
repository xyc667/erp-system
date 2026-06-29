$ErrorActionPreference = "Stop"
$migrationsRoot = Join-Path $PSScriptRoot "..\backend\prisma\migrations"
$lockFile = Join-Path $migrationsRoot "migration_lock.toml"

if (-not (Test-Path $lockFile)) {
  Write-Error "Missing migration_lock.toml"
}

$dirs = Get-ChildItem $migrationsRoot -Directory | Sort-Object Name
if ($dirs.Count -eq 0) {
  Write-Error "No migration directories found"
}

$missing = @()
foreach ($dir in $dirs) {
  $sql = Join-Path $dir.FullName "migration.sql"
  if (-not (Test-Path $sql)) {
    $missing += $dir.Name
  } else {
    $size = (Get-Item $sql).Length
    if ($size -lt 10) {
      $missing += "$($dir.Name) (empty migration.sql)"
    }
  }
}

if ($missing.Count -gt 0) {
  Write-Error "Missing or invalid migration.sql in:`n$($missing -join "`n")"
}

Write-Host "OK: $($dirs.Count) migration folders each contain migration.sql"
