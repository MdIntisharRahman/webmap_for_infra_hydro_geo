echo "Starting Webmap Environment..."

# Update the PostgreSQL database directly
echo "--> Syncing maps to PostGIS database..."
uv run --env-file .env python import_local_maps.py
