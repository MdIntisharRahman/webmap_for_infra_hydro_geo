#!/bin/bash
# Wait for PostGIS to be ready (a simple wait is usually enough for a fast start)
echo "Waiting 10 seconds for PostGIS to initialize..."
sleep 10

echo "Syncing maps into PostGIS database..."
uv run python import_local_maps.py

PORT="${PORT:-8484}"
echo "Starting FastAPI Backend Server on port $PORT..."
exec uv run uvicorn backend.main:app --host 0.0.0.0 --port $PORT
