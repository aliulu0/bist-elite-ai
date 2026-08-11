# ==========================================================
# BIST Elite AI - Health Check
# ==========================================================
# Usage: .\scripts\health.ps1

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BIST Elite AI - Service Health" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSeconds = 3
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  $Name" -ForegroundColor Green
            Write-Host "    Status: UP" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "  $Name" -ForegroundColor Red
        Write-Host "    Status: DOWN" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
        return $false
    }
}

function Test-Container {
    param(
        [string]$Name
    )
    $status = docker compose ps $Name --format "{{.Status}}" 2>$null
    if ($status -match "Up") {
        Write-Host "  $Name" -ForegroundColor Green
        Write-Host "    Status: $status" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  $Name" -ForegroundColor Red
        Write-Host "    Status: $status" -ForegroundColor Red
        return $false
    }
}

# Check containers
Write-Host "Containers:" -ForegroundColor Yellow
Test-Container -Name "postgres"
Test-Container -Name "redis"
Test-Container -Name "api"
Test-Container -Name "scheduler"
Test-Container -Name "web"
Write-Host ""

# Check endpoints
Write-Host "Endpoints:" -ForegroundColor Yellow

$apiUp = Test-Endpoint -Name "API (http://localhost:3001/health)" -Url "http://localhost:3001/health"
$webUp = Test-Endpoint -Name "Web (http://localhost:3000)" -Url "http://localhost:3000"
$workerUp = Test-Endpoint -Name "Worker (http://localhost:8000/health)" -Url "http://localhost:8000/health"
$docsUp = Test-Endpoint -Name "Swagger (http://localhost:3001/api/docs)" -Url "http://localhost:3001/api/docs"
Write-Host ""

# Check database
Write-Host "Database:" -ForegroundColor Yellow
$pgReady = docker compose exec -T postgres pg_isready -U postgres 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  PostgreSQL" -ForegroundColor Green
    Write-Host "    Status: ACCEPTING CONNECTIONS" -ForegroundColor Green
} else {
    Write-Host "  PostgreSQL" -ForegroundColor Red
    Write-Host "    Status: NOT READY" -ForegroundColor Red
}

# Check Redis
$redisReady = docker compose exec -T redis redis-cli ping 2>$null
if ($redisReady -match "PONG") {
    Write-Host "  Redis" -ForegroundColor Green
    Write-Host "    Status: PONG" -ForegroundColor Green
} else {
    Write-Host "  Redis" -ForegroundColor Red
    Write-Host "    Status: NOT RESPONDING" -ForegroundColor Red
}
Write-Host ""

# Summary
$allHealthy = $apiUp -and $webUp -and $workerUp
if ($allHealthy) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " All Systems Operational" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " Some Services Are Down" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Troubleshoot: docker compose logs <service>" -ForegroundColor Gray
}
