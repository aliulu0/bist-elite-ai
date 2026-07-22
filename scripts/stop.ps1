# ==========================================================
# BIST Elite AI - Stop All Services
# ==========================================================
# Usage: .\scripts\stop.ps1
#        .\scripts\stop.ps1 -Clean   (remove volumes too)

param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BIST Elite AI - Stopping Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Clean) {
    Write-Host "  Stopping services and removing volumes..." -ForegroundColor Yellow
    docker compose down -v --remove-orphans
} else {
    Write-Host "  Stopping services (volumes preserved)..." -ForegroundColor Yellow
    docker compose down --remove-orphans
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Warning: Some containers may not have stopped cleanly" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Services Stopped" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($Clean) {
    Write-Host "  Volumes removed (data lost)" -ForegroundColor Yellow
    Write-Host "  Run .\scripts\setup.ps1 to reinitialize" -ForegroundColor Gray
} else {
    Write-Host "  Volumes preserved (data retained)" -ForegroundColor Green
    Write-Host "  Run .\scripts\dev.ps1 to restart" -ForegroundColor Gray
}
