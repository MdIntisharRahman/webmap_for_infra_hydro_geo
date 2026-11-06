# Webmap Local Startup Script for Windows PowerShell
$ErrorActionPreference = "Stop"

Write-Host "Starting Webmap Environment..." -ForegroundColor Cyan

# 1. Start FastAPI Backend on port 8484
Write-Host "--> Starting FastAPI Backend on port 8484..." -ForegroundColor Green
$backend = Start-Process -FilePath "uv" -ArgumentList "run --env-file .env python -m uvicorn backend.main:app --port 8484 --reload" -PassThru

# 2. Start Frontend Web Server on port 8383
Write-Host "--> Starting Frontend Web Server on port 8383..." -ForegroundColor Green
$frontend = Start-Process -FilePath "uv" -ArgumentList "run --env-file .env python -m http.server 8383 -d frontend" -PassThru

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Yellow
Write-Host "✅ Everything is running!" -ForegroundColor Green
Write-Host "🌍 Open your browser and go to: http://localhost:8383" -ForegroundColor Cyan
Write-Host "🛑 Press [Ctrl+C] to stop all servers." -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Yellow

try {
    # Keep running and clean up child processes when terminated
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nShutting down servers..." -ForegroundColor Red
    if ($backend -and !$backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontend -and !$frontend.HasExited) {
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    }
}
