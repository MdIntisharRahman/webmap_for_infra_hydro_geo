#!/bin/bash
cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
echo "Starting Webmap Environment..."

# Update the PostgreSQL database directly
echo "--> Syncing maps to PostGIS database..."
uv run --env-file .env python import_local_maps.py


echo "Starting Webmap Environment..."


# Start the Backend API server in the background
echo "--> Starting FastAPI Backend on port 8484..."
uv run --env-file .env python -m uvicorn backend.main:app --port 8484 --reload &
BACKEND_PID=$!

# Start the Frontend Web server in the background
echo "--> Starting Frontend Web Server on port 8383..."
uv run --env-file .env python -m http.server 8383 -d frontend &
FRONTEND_PID=$!

echo ""
echo "==========================================================="
echo "✅ Everything is running!"
echo "🌍 Open your browser and go to: http://localhost:8383"
echo "🛑 Press [CTRL+C] to stop all servers."
echo "==========================================================="

# Trap CTRL+C to cleanly shut down the background processes
trap "echo 'Shutting down servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Wait indefinitely until CTRL+C is pressed
wait
