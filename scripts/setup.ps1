# ==========================================================
# BIST Elite AI - Development Setup Script
# ==========================================================
# Usage: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BIST Elite AI - Development Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check prerequisites
Write-Host "[1/7] Checking prerequisites..." -ForegroundColor Yellow

$missing = @()

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $missing += "Node.js (https://nodejs.org/)"
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    $missing += "pnpm (run: corepack enable)"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    $missing += "Docker Desktop (https://docker.com/products/docker-desktop)"
}

if ($missing.Count -gt 0) {
    Write-Host "  Missing prerequisites:" -ForegroundColor Red
    foreach ($m in $missing) {
        Write-Host "    - $m" -ForegroundColor Red
    }
    exit 1
}

$nodeVersion = node --version
$pnpmVersion = pnpm --version
$dockerVersion = docker --version

Write-Host "  Node.js:   $nodeVersion" -ForegroundColor Green
Write-Host "  pnpm:      $pnpmVersion" -ForegroundColor Green
Write-Host "  Docker:    $dockerVersion" -ForegroundColor Green

# 2. Copy environment file
Write-Host ""
Write-Host "[2/7] Setting up environment..." -ForegroundColor Yellow

if (-not (Test-Path -LiteralPath ".env")) {
    if (Test-Path -LiteralPath ".env.development") {
        Copy-Item ".env.development" ".env"
        Write-Host "  Created .env from .env.development" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No .env.development found" -ForegroundColor Yellow
    }
} else {
    Write-Host "  .env already exists, skipping" -ForegroundColor Green
}

# 3. Install Node.js dependencies
Write-Host ""
Write-Host "[3/7] Installing Node.js dependencies..." -ForegroundColor Yellow

pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  pnpm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed" -ForegroundColor Green

# 4. Generate Prisma client
Write-Host ""
Write-Host "[4/7] Generating Prisma client..." -ForegroundColor Yellow

$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/bist_elite_ai"

if (Test-Path -LiteralPath "apps\api\prisma\schema.prisma") {
    Push-Location "apps\api"
    npx prisma generate
    Pop-Location
    Write-Host "  Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "  No Prisma schema found, skipping" -ForegroundColor Yellow
}

# 5. Start infrastructure containers
Write-Host ""
Write-Host "[5/7] Starting PostgreSQL and Redis..." -ForegroundColor Yellow

docker compose up -d postgres redis
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Failed to start infrastructure containers" -ForegroundColor Red
    exit 1
}

Write-Host "  Waiting for containers to be healthy..."
Start-Sleep -Seconds 5

# Verify health
$pgReady = docker compose ps postgres --format "{{.Status}}" 2>$null
$redisReady = docker compose ps redis --format "{{.Status}}" 2>$null

Write-Host "  PostgreSQL: $pgReady" -ForegroundColor Green
Write-Host "  Redis:      $redisReady" -ForegroundColor Green

# 6. Run database migrations (if available)
Write-Host ""
Write-Host "[6/7] Database setup..." -ForegroundColor Yellow

if (Test-Path -LiteralPath "apps\api\prisma\schema.prisma") {
    Push-Location "apps\api"
    npx prisma migrate dev --name init 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  No migrations to run (schema may not exist yet)" -ForegroundColor Yellow
    } else {
        Write-Host "  Migrations applied" -ForegroundColor Green
    }
    Pop-Location
} else {
    Write-Host "  No Prisma schema, skipping migrations" -ForegroundColor Yellow
}

# 7. Verify
Write-Host ""
Write-Host "[7/7] Verifying setup..." -ForegroundColor Yellow

$services = docker compose ps --format "{{.Name}}: {{.Status}}" 2>$null
Write-Host "  Running containers:" -ForegroundColor Green
foreach ($s in $services) {
    Write-Host "    $s" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Cyan
Write-Host "  .\scripts\dev.ps1        Start all services" -ForegroundColor White
Write-Host "  .\scripts\stop.ps1       Stop all services" -ForegroundColor White
Write-Host "  .\scripts\health.ps1     Check service health" -ForegroundColor White
Write-Host ""
Write-Host "Manual Start (without Docker):" -ForegroundColor Cyan
Write-Host "  Push-Location apps\api; npm run dev; Pop-Location" -ForegroundColor White
Write-Host "  Push-Location apps\web; npm run dev; Pop-Location" -ForegroundColor White
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Web:       http://localhost:3000" -ForegroundColor White
Write-Host "  API:       http://localhost:3001" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "  Worker:    http://localhost:8000" -ForegroundColor White
Write-Host "  PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "  Redis:     localhost:6379" -ForegroundColor White
