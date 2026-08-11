# ==========================================================
# BIST Elite AI - Start Development Services
# ==========================================================
# Usage: .\scripts\dev.ps1
#        .\scripts\dev.ps1 -Build    (rebuild containers)
#        .\scripts\dev.ps1 -Detached (run in background)

param(
    [switch]$Build,
    [switch]$Detached
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BIST Elite AI - Starting Dev Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if docker-compose.override.yml exists
if (-not (Test-Path -LiteralPath "docker-compose.override.yml")) {
    Write-Host "  docker-compose.override.yml not found" -ForegroundColor Yellow
    Write-Host "  Using base docker-compose.yml only" -ForegroundColor Yellow
}

# Build if requested
$composeArgs = @("up")
if ($Build) {
    Write-Host "  Rebuilding containers..." -ForegroundColor Yellow
    $composeArgs += "--build"
}
if ($Detached) {
    $composeArgs += "-d"
}

# Start services
Write-Host "  Starting all services..." -ForegroundColor Yellow
docker compose up @composeArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  Failed to start services" -ForegroundColor Red
    Write-Host "  Check logs: docker compose logs" -ForegroundColor Yellow
    exit 1
}

if ($Detached) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Services Started (detached)" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "  API:       http://localhost:3001" -ForegroundColor White
    Write-Host "  API Docs:  http://localhost:3001/api/docs" -ForegroundColor White
    Write-Host "  PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "  Redis:     localhost:6379" -ForegroundColor White
    Write-Host "  Scheduler: (running, no HTTP port)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Logs:    docker compose logs -f" -ForegroundColor Gray
    Write-Host "  Stop:    .\scripts\stop.ps1" -ForegroundColor Gray
}
