@echo off
title Webmap Local Servers
echo Starting Webmap Environment...

echo --> Starting FastAPI Backend on port 8484...
start "Webmap Backend (8484)" uv run --env-file .env python -m uvicorn backend.main:app --port 8484 --reload

echo --> Starting Frontend Web Server on port 8383...
start "Webmap Frontend (8383)" uv run --env-file .env python -m http.server 8383 -d frontend

echo.
echo ===========================================================
echo [OK] Everything is running!
echo Open your browser and go to: http://localhost:8383
echo ===========================================================
echo.
pause
